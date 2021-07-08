const fs = require("fs");
const crypto = require("crypto");
const https = require("https");

const RA_config = {
	ias: {
		url: "https://api.trustedservices.intel.com/",
		path: "/sgx/dev",
		key: JSON.parse(fs.readFileSync("iaskey.json")),
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

function ias_query_verify(quote_raw, callback_reply, callback_error){
	// callback_reply(quote, cert, signature, warning=null) -> reply with quote, certificate, signature and optional warning message
	// callback_error(error_msg) -> reply with error message
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

			var certpem = decodeURIComponent(res.headers['x-iasreport-signing-certificate']);
			var sign = Buffer.from(res.headers['x-iasreport-signature'], "base64");
			
			var cert = new crypto.X509Certificate(certpem);

			if(!cert.verify(RA_config.ias.cert.publicKey)
			|| !crypto.verify("RSA-SHA256", fulldat, cert.publicKey, sign)){
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

			callback_reply(quote, certpem, sign, warning);

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

module.exports.ias_query_sigrl = ias_query_sigrl;
module.exports.ias_query_verify = ias_query_verify;
