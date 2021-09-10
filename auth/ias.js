const fs = require("fs");
const crypto = require("crypto");
const https = require("https");

const forge = require("node-forge");

const config = JSON.parse(fs.readFileSync("config.json"));

const RA_config = {
	ias: {
		url: "https://api.trustedservices.intel.com/",
		path: "/sgx/dev",
		key: config.ias,
		cert: new crypto.X509Certificate(fs.readFileSync("Intel_SGX_Attestation_RootCA.pem")),
	},
};

var RA_global = {
	timestamp: Date.now(),
};

function ias_query_sigrl(epid_gid, callback_reply, callback_error){
	//callback_reply(sigrl_data) -> emit sigrl data
	//callback_error(error_msg) -> emit error_msg
	if(!Number.isInteger(epid_gid)){
		throw new TypeError("epid_gid must be an integer");
	}
	if(!(0 <= epid_gid && epid_gid < (2 ** 32))){
		throw new RangeError("epid_gid must be in range of 32bit unsigned integer");
	}

	// IAS QUERY
	var reqsigrl = https.request(RA_config.ias.url, {
		method: "GET",
		path: `${RA_config.ias.path}/attestation/v4/sigrl/${epid_gid.toString(16).padStart(8, '0')}`,
		headers: {
		       "Ocp-Apim-Subscription-Key": RA_config.ias.key.primary,
		},
	}, function(res){
		var datlist = [];
		var contentlen = res.headers["content-length"];

		res.on("data", function(data){
			datlist.push(data);
		});
		res.on("end", function(){
			// finish request
			var fulldat = Buffer.concat(datlist);

			callback_reply(fulldat);
		});
	});

	reqsigrl.on("error", function(err){
		callback_error("IAS reply error");
	});

	reqsigrl.end();

}

// quote_raw: EPID quote extracted from Intel SGX
// callback_reply(quote, cert, signature, certca, warning=null)
//	-> reply with quote, certificate, signature and optional warning message
// callback_error(error_msg)
//	-> reply with error message
function ias_query_verify(quote_raw, callback_reply, callback_error){
	if(quote_raw instanceof String)
		quote_raw = Buffer.from(quote_raw);
	if(!(quote_raw instanceof Buffer))
		throw new TypeError("quote_raw must be a buffer");

	// IAS QUERY
	var reqverify = https.request(RA_config.ias.url, {
		method: "POST",
		path: `${RA_config.ias.path}/attestation/v4/report`,
		headers: {
			"Content-Type": "application/json",
			"Ocp-Apim-Subscription-Key": RA_config.ias.key.primary,
		},
	}, function(res){
		switch(res.statusCode){
			case 200: break;
			case 400: callback_error("invalid quote data"); return; break;
			case 401:
				callback_error("server internal error");
				console.error("authentication error");
				return; break;
			case 500:
			case 503:
			default:
				callback_error("ias server internal error");
				console.error("ias server internal error");
				return; break;
		}

		var datlist = [];
		
		var cert = decodeURIComponent(res.headers['x-iasreport-signing-certificate']);
		var sign = Buffer.from(res.headers['x-iasreport-signature'], "base64");

		res.on("data", function(data){
			datlist.push(data);
		});
		res.on("end", function(){
			// finish request
			var fulldat = Buffer.concat(datlist);
			var iasverify = JSON.parse(fulldat);

			var certchain = decodeURIComponent(res.headers['x-iasreport-signing-certificate']);
			var sign = res.headers['x-iasreport-signature'];

			var splitindex;
			{
				let delim = "-----END CERTIFICATE-----";
				let index_start = certchain.indexOf(delim);
				if(index_start < 0){
					callback_error("ias certificate chain in unexpected form");
					console.error("ias returned unexpected certificate chain", certchain);
				}
				splitindex = index_start + delim.length;
			}

			var certpem = certchain.substring(0, splitindex);
			var certcapem = certchain.substring(splitindex);
			
			var cert = new crypto.X509Certificate(certpem);
			var certca = RA_config.ias.cert;

			{
				if(certcapem){
					try{
					var newcertca = new crypto.X509Certificate(certcapem);

					if(newcertca.verify(certca.publicKey))
						certca = newcertca;
					} catch(e){
						// certcapem invalid
					}
				}
			}

			if(!cert.verify(RA_config.ias.cert.publicKey)
			|| !crypto.verify("RSA-SHA256", fulldat, cert.publicKey, Buffer.from(sign, "base64"))){
				callback_error("invalid signature");
				return;
			}

			{
				let timestamp = Date.parse(iasverify.timestamp);
				if(timestamp <= RA_global.timestamp){
					callback_error("possible replay attack detected");
					return;
				}
				RA_global.timestamp = timestamp;
			}

			if(iasverify.version !== 4){
				callback_error("IAS version invalid");
				return;
			}

			var warning;

			switch(iasverify.isvEnclaveQuoteStatus){
				default: {
					callback_error("quote status invalid");
					return;
				}
					break;

				case "GROUP_OUT_OF_DATE":
				case "CONFIGURATION_NEEDED":
				case "SW_HARDENING_NEEDED":
				case "CONFIGURATION_AND_SW_HARDENING_NEEDED":
					warning = `isvEnclaveQuoteStatus is ${iasverify.isvEnclaveQuoteStatus}.`;
				case "OK":
					break;
			}

			var quote = Buffer.from(iasverify.isvEnclaveQuoteBody, "base64");

			callback_reply(fulldat, certpem, sign, certcapem, warning);
		});
	});

	reqverify.on("error", function(err){
		callback_error("IAS reply error");
	});

	var payload = JSON.stringify(
		{
			isvEnclaveQuote: quote_raw.toString("base64"),
			//pseManifest: null,
			//nonce: Date.now(),
		}
	);

	reqverify.write(payload);

	reqverify.end();

}

// report: attestation verification report returned on body of IAS /attestation/v4/report
// certpem: certificate of signer at IAS
// sign: signature of data by signer at IAS
// certcapem: certificate CA of certpem
function ias_verify(report, certpem, sign, certcapem){
	var cert = new crypto.X509Certificate(certpem);
	var certca = RA_config.ias.cert;

	if(certcapem){
		var newcertca = new crypto.X509Certificate(certcapem);

		if(newcertca.verify(certca.publicKey))
			certca = newcertca;
	}

	if(!cert.verify(RA_config.ias.cert.publicKey)
	|| !crypto.verify("RSA-SHA256", report, cert.publicKey, Buffer.from(sign, "base64"))){
		return false;
	}

	var iasverify = JSON.parse(report);

	switch(iasverify.isvEnclaveQuoteStatus){
		default: {
			return false;
		}
			break;

		case "GROUP_OUT_OF_DATE":
		case "CONFIGURATION_NEEDED":
		case "SW_HARDENING_NEEDED":
		case "CONFIGURATION_AND_SW_HARDENING_NEEDED":
			console.warn(`isvEnclaveQuoteStatus is ${iasverify.isvEnclaveQuoteStatus}.`);
		case "OK":
			break;
	}

	var quote = Buffer.from(iasverify.isvEnclaveQuoteBody, "base64");
	
	return true;
}

{
	const oid_ra_tls = {
		ias_response_body_oid: "0.6.9.42.840.113741.1337.2",
		ias_root_cert_oid: "0.6.9.42.840.113741.1337.3",
		ias_leaf_cert_oid: "0.6.9.42.840.113741.1337.4",
		ias_report_signature_oid: "0.6.9.42.840.113741.1337.5",
		quote_oid: "0.6.9.42.840.113741.1337.6",
	};
	// callback_success( warning_message )
	// callback_fail( error_message )
	function verify_cert(certobj, callback_success, callback_fail){
		if(!certobj || !certobj.raw){
			callback_fail("certificate is null");
			return;
		}

		let peercert = forge.pki.certificateFromAsn1(
			forge.asn1.fromDer(
				certobj.raw.toString("binary")
			)
		);

		let extensions = peercert.extensions;
		if(!extensions) return false;

		let quotedat;
		let signature;
		let cert;
		let certca;

		for(let ext of extensions){
			let value = Buffer.from(ext.value, "binary");
			switch(ext.id){
				case oid_ra_tls.ias_response_body_oid: {
					quotedat = value;
				} break;
				case oid_ra_tls.ias_root_cert_oid: {
					certca = value;
				} break;
				case oid_ra_tls.ias_leaf_cert_oid: {
					cert = value;
				} break;
				case oid_ra_tls.ias_report_signature_oid: {
					signature = value;
				} break;
				case oid_ra_tls.quote_oid: {
					// make synchronous
					ias_query_verify(value, 
						function(quotedat, certpem, sign, certca, warning){
							callback_success(warning)
						}, 
						callback_fail
					);
					return;
				} break;
				default: break;
			}
		}

		if(!quotedat || !signature || !cert || !certca){
			callback_fail("one or more fields are missing");
			return;
		}

		if(ias_verify(quotedat, cert, signature, certca)){
			callback_success();
			return;
		} else{
			callback_fail("invalid quote");
			return;
		}
	}
}

module.exports.ias_query_sigrl = ias_query_sigrl;
module.exports.ias_query_verify = ias_query_verify;
module.exports.ias_verify = ias_verify;
module.exports.verify_cert = verify_cert;
