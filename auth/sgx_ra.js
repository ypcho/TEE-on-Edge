const crypto = require("crypto");
const fs = require("fs");

function aes128cmac(K, M){
	const const_Zero = Buffer.alloc(16, 0x00);
	const const_Rb = Buffer.concat([ Buffer.alloc(15, 0x00), Buffer.from([0x87]) ]);
	function getcipher(K){
		return crypto.createCipheriv("aes128", K, Buffer.alloc(16, 0x00));
	}

	function BufferSHL1(B){
		if(B.length <= 0) return Buffer.allocUnsafe(0);

		var output = Buffer.allocUnsafe(B.length);

		for(var k=0;k<B.length-1;++k)
			output[k] = (B[k] << 1) | (B[k+1] >> 7);
		output[B.length-1] = B[B.length-1] << 1;
		
		return output;
	}

	function BufferXOR(L, R){
		var outputlen = Math.min(L.length, R.length);

		for(var k=0;k<outputlen;++k)
			L[k] = L[k] ^ R[k];

		return L;
	}

	var K1, K2;
	{
		let L;
		{
			let cipher = getcipher(K);
			L = cipher.update(const_Zero);
			cipher.final()
		}

		K1 = BufferSHL1(L);
		if(L[0] & 0x80) K1 = BufferXOR(K1, const_Rb);

		K2 = BufferSHL1(K1);
		if(K1[0] & 0x80) K2 = BufferXOR(K2, const_Rb);
	}

	var cipher = getcipher(K);
	var output;

	{
		let lastblock;

		if(M.length === 0){
			lastblock = K2;
			lastblock[0] ^= 0x80;
		} else{
			let lastlen = M.length % 16;
			let trunclen = M.length;

			if(lastlen === 0){
				trunclen -= 16;
			} else trunclen -= lastlen;

			cipher.update(M.subarray(0, trunclen));

			if(lastlen === 0){
				lastblock = BufferXOR(K1, M.subarray(trunclen));
			} else{
				lastblock = BufferXOR(K2, M.subarray(trunclen));
				lastblock[lastlen] ^= 0x80;
			}
		}
		
		output = cipher.update(lastblock);
	}
	
	cipher.final();

	return output;
}

var RA_global = {
	timestamp: Date.now(),
};

function do_ra_msg1(state){
	// handle ra message 1
	var data_ga = state.buffer.subarray(0, 64);
	var data_epid_gid = state.buffer.subarray(64, 68);
	state.buffer = Buffer.from(state.buffer.subarray(68));

	// extract ga
	var ga = Buffer.allocUnsafe(1 + 32 + 32);
	ga[0] = 0x04;
	data_ga.copy(ga, 1, 0, 64);
	ga.subarray(1, 1+32).reverse();
	ga.subarray(1+32, 1+32+32).reverse();
	state.ga = Buffer.from(data_ga);

	var epid_gid = data_epid_gid.readUInt32LE();
	state.epid_gid = epid_gid;

	// derive key with AES-128 CMAC
	var ECDH = crypto.createECDH("prime256v1");
	state.ECDH = ECDH;

	ECDH.generateKeys();

	var data_gb = ECDH.getPublicKey().subarray(1, 65);
	data_gb.subarray(0, 32).reverse();
	data_gb.subarray(32, 64).reverse();
	state.gb = data_gb;

	state.sharedsecret = ECDH.computeSecret(ga);
	state.sharedsecret.reverse();
	state.KDK = aes128cmac(Buffer.alloc(16, 0x00), state.sharedsecret);
	state.SMK = aes128cmac(state.KDK, Buffer.concat([ Buffer.from([0x01]), Buffer.from("SMK"), Buffer.from([0x00, 0x80, 0x00]) ]));

	// ECDSA
	var signdat = Buffer.allocUnsafe(128);

	data_gb.copy(signdat, 0, 0, 64);
	data_ga.copy(signdat, 64, 0, 64);

	console.log("signing data:", signdat.toString("hex"));
	
	var signature = crypto.sign("SHA256", signdat, {
		key: RA_config.Kpriv,
		dsaEncoding: "ieee-p1363",
	});
	signature.subarray(0, 32).reverse();
	signature.subarray(32, 64).reverse();
	console.log("signature:", signature.toString("hex"));
	state.signature = signature;

	// AES-128 CMAC of whole body
	var msg2 = [
		data_gb,
		Buffer.from(RA_config.ias.key.SPID, "hex"),
		Buffer.allocUnsafe(2), //write quote type
		Buffer.allocUnsafe(2), //write KDF_ID
		signature,
		null, //insert cmac of msg
		null //insert sigrl data
	];

	msg2[2].writeUInt16LE(RA_config.quote_type);
	msg2[3].writeUInt16LE(RA_config.KDF_ID);

	msg2[5] = aes128cmac(state.SMK, Buffer.concat(msg2.slice(0, 5)));

	// IAS QUERY
	var reqsigrl = https.request(RA_config.ias.url, {
		method: "GET",
		path: `${RA_config.ias.path}/attestation/v4/sigrl/${epid_gid.toString(16).padStart(8, '0')}`,
		headers: {
		       "Ocp-Apim-Subscription-Key": RA_config.ias.key.primary,
		},
	}, function(res){
		//console.log(res);

		var datlist = [];
		var contentlen = res.headers["content-length"];

		res.on("data", function(data){
			datlist.push(data);
		});
		res.on("end", function(){
			// finish request
			var fulldat = Buffer.concat(datlist);
			state.sigrl = fulldat;

			console.log(`received sigrl data ${fulldat.length} with header content-len ${contentlen}`);
			
			var data_len = Buffer.allocUnsafe(4);
			data_len.writeUInt32LE(contentlen);

			msg2[6] = Buffer.concat([data_len, fulldat]);

			// send msg2
			console.log(`integrating list of buffers`, msg2);
			msg2 = Buffer.concat(msg2);
			console.log(`sending message 2 len ${msg2.length} :`, msg2);
			state.emit(msg2);

		});
	});

	reqsigrl.on("error", function(err){
		// abort ra
		console.log(reqsigrl);
		state.raabort();
	});

	reqsigrl.end();
	//console.log(reqsigrl);

	state.rastep = 2;
}

function do_ra_msg3(state){
	// handle ra message 3
	console.log("msg3 handler invoked");
	console.log("data:", state.buffer.toString("hex"));

	var signaturelen = state.buffer.readUInt32LE(16 + 64 + 256 + 432);
	var data_full = state.buffer.subarray(0, 16 + 64 + 256 + 436 + signaturelen);
	//state.buffer = Buffer.from(state.buffer.subarray(16 + 64 + 256 + 436 + signaturelen));

	// unpack data
	var data_cmac = data_full.subarray(0, 16);
	var data_ga = data_full.subarray(16, 16 + 64);
	var data_secprop = data_full.subarray(16 + 64, 16 + 64 + 256);
	var data_quote = data_full.subarray(16 + 64 + 256);

	if(!data_ga.equals(state.ga)){
		state.raabort();
		return;
	}
	console.log("ga matched");

	if(!data_cmac.equals(aes128cmac(state.SMK, data_full.subarray(16)))){
		state.raabort();
		return;
	}
	console.log("cmac matched");

	{
		state.VK = aes128cmac(state.KDK, Buffer.concat([ Buffer.from([0x01]), Buffer.from("VK"), Buffer.from([0x00, 0x80, 0x00]) ]));
		let reportdigest = crypto.createHash("SHA256").update(
			Buffer.concat([state.ga, state.gb, state.VK])
		).digest();
		if(!reportdigest.equals(data_quote.subarray(48 + 320, 48 + 320 + 32))){
			state.raabort();
			return;
		}
	}
	console.log("report digest matched");
	
	// Step 4
	// IAS QUERY
	var reqverify = https.request(RA_config.ias.url, {
		method: "POST",
		path: `${RA_config.ias.path}/attestation/v4/report`,
		headers: {
			"Content-Type": "application/json",
			"Ocp-Apim-Subscription-Key": RA_config.ias.key.primary,
		},
	}, function(res){
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
			console.log("ias verify response body:", iasverify);
			state.verify = {
				response: res,
				body: iasverify,
				bodyraw: fulldat,
			};
			//state.verify = iasverify;

			// Step 4
			var certpem = decodeURIComponent(res.headers['x-iasreport-signing-certificate']);
			var sign = Buffer.from(res.headers['x-iasreport-signature'], "base64");
			
			var cert = new crypto.X509Certificate(certpem);

			if(!cert.verify(RA_config.ias.cert.publicKey)
			|| !crypto.verify("RSA-SHA256", fulldat, cert.publicKey, sign)){
				state.raabort();
				return;
			}

			{
				let timestamp = Date.parse(iasverify.timestamp);
				if(timestamp <= RA_global.timestamp){
					state.raabort();
					return;
				}
				RA_global.timestamp = timestamp;
			}

			if(iasverify.version !== 4){
				state.raabort();
				return;
			}

			switch(iasverify.isvEnclaveQuoteStatus){
				default: {
					state.raabort();
					return;
				}
					break;

				case "GROUP_OUT_OF_DATE":
				case "CONFIGURATION_NEEDED":
				case "SW_HARDENING_NEEDED":
				case "CONFIGURATION_AND_SW_HARDENING_NEEDED":
					console.log(`isvEnclaveQuoteStatus is ${iasverify.isvEnclaveQuoteStatus}.`);
				case "OK":
					break;
			}

			var quote = Buffer.from(iasverify.isvEnclaveQuoteBody, "base64");
			
			// Mark LKR
			//Future TODO: Step 5
			//check any information for additional verification of quote structure
			//reference: https://software.intel.com/content/www/us/en/develop/articles/code-sample-intel-software-guard-extensions-remote-attestation-end-to-end-example.html
			//reference: https://github.com/intel/sgx-ra-sample
			//maybe consider ECDSA

			state.rasuccess();

		});
	});

	reqverify.on("error", function(err){
		// abort ra
		console.log(reqverify);
		state.raabort();
	});

	reqverify.write(
		JSON.stringify(
			{
				isvEnclaveQuote: data_quote.toString("base64"),
				//pseManifest: null,
				//nonce: Date.now(),
			}
		)
	);

	reqverify.end();

	// Step 6
	state.MK = aes128cmac(state.KDK, Buffer.concat([ Buffer.from([0x01]), Buffer.from("MK"), Buffer.from([0x00, 0x80, 0x00]) ]));
	state.SK = aes128cmac(state.KDK, Buffer.concat([ Buffer.from([0x01]), Buffer.from("SK"), Buffer.from([0x00, 0x80, 0x00]) ]));

}

function handle_data(state){
	switch(state.rastep){
		case 0:
			if(state.buffer.length < 64 + 4) break;
			else state.rastep = 1;
		case 1:
			do_ra_msg1(state);
		case 2:
			if(state.buffer.length < 16 + 64 + 256 + 436) break;
			else{
				let signaturelen = state.buffer.readUInt32LE(16 + 64 + 256 + 432);
				if(state.buffer.length < 16 + 64 + 256 + 436 + signaturelen) break;
				else state.rastep = 3;
			}
		case 3:
			do_ra_msg3(state);
	}
}

function RAState(RA_config, emit, raabort, rasuccess){
	if(!(this instanceof RAState)) return new RAState(RA_config, emit);

	if(!RA_config || !emit || !raabort || !rasuccess) throw TypeError("RAState argument inadequate");

	this.RA_config = RA_config;
	this.emit = emit;
	this.raabort = raabort;
	this.rasuccess = rasuccess;

	this.buffer = Buffer.alloc(0);
	this.rastep = 1;
}

RAState.prototype.handle = function(data){
	this.buffer = Buffer.concat([this.buffer, data]);
	handle_data(this);
}

module.exports.RAState = RAState;
