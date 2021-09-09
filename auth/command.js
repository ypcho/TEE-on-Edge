
const fs = require("fs");
const crypto = require("crypto");
const forge = require("node-forge");

const { to_resp, to_errorstring } = require("./redis-format");

const ias = require("./ias");

const config = JSON.parse(fs.readFileSync("config.json"));

const redis = require("redis");
const redisoptions = {
	host: config.ip,
	port: 6379,
	return_buffers: true,
	user: "admin",
	password: "defaultpassword",
	tls: {
		ca: fs.readFileSync("sp_cert_ca.crt"),
	},
	retry_strategy: function(options){
		console.log("redis connection error: retrying after 3 seconds");
		return 3000;
	},
};

const client = redis.createClient(redisoptions);

client.on("error", console.error);

const globaloptions = {
	passwordharden: false,
};
if(globaloptions.passwordharden){
	let oldpasswordhash = crypto.createHash("SHA256").update(redisoptions.password).digest().toString("hex");
	let password = crypto.randomBytes(32).toString("hex");
	let passwordhash = crypto.createHash("SHA256").update(password).digest().toString("hex");

	client.acl("setuser", redisoptions.user, '!'+oldpasswordhash, '#'+passwordhash, 
		function(err, reply){
			if(err){
				throw err;
			} else{
				redisoptions.password = password;
			}
		}
	);
}

function encode(DeviceID, ServiceID){
	return `${DeviceID}:${ServiceID}`;
}

const re_ID = new RegExp("^(?<DeviceID>[A-Za-z0-9]+):(?<ServiceID>[A-Za-z0-9]+)$");
function decode(ID){
	var match_ID = re_ID.exec(ID);
	if(match_ID){
		return match_ID.groups;
	}
}

{
	const oid_ra_tls = {
		ias_response_body_oid: "1.2.840.113741.1337.2",
		ias_root_cert_oid: "1.2.840.113741.1337.3",
		ias_leaf_cert_oid: "1.2.840.113741.1337.4",
		ias_report_signature_oid: "1.2.840.113741.1337.5",
	};
	function verify_cert(certobj){
		let peercert = forge.pki.certificateFromPem((new crypto.X509Certificate(certobj.raw)).toString())

		let extensions = peercert.extensions;
		if(!extensions)
			return false;

		let quotedat = extensions[oid_ra_tls.ias_response_body_oid];
		let signature = extensions[oid_ra_tls.ias_report_signature_oid];
		let cert = extensions[oid_ra_tls.ias_leaf_cert_oid];
		let certca = extensions[oid_ra_tls.ias_root_cert_oid];
		if(!quotedat || !signature || !cert || !certca)
			return false;

		return ias.ias_verify(quotedat, signature, cert);
	}
}

const globals = {
	timestamp: Date.now(),

};

function command_AUTH(state){
	// command AUTH <Device ID, Service ID>

	// Step 1 RA
	if(!state.authenticated){
		let peercertobj = state.socket.getPeerCertificate();
		if(peercertobj.raw && verify_cert(peercertobj)){
			state.authenticated = true;
		}

		if(!state.authenticated){
			// open ra subsession
			// okay to refuse
			// TODO
			// state.socket.write(to_errorstring("ERROR NOT AUTHENTICATED"));
			// accept unauthorized for now
		}
	}
	
	// Step 2 Authorize access to redis by give ACL permission
	var ACL_ID;
	while(true){
		let now = Date.now();
		if(globals.timestamp < now){
			ACL_ID = now.toString();
			break;
		}
	}

	var ACL_PW = crypto.randomBytes(32).toString("hex");
	let ACL_PWHASH = crypto.createHash("SHA256").update(ACL_PW).digest().toString("hex");
	
	// Return ACL ID/PW
	client.acl("setuser", ACL_ID, "on", '#'+ACL_PWHASH, "~*", "resetchannels", "+get", "+info",
		function(err, reply){
			if(err){
				state.socket.write(to_errorstring("ERR user creation fail"));
			} else{
				state.socket.write(to_resp(["OK", [ACL_ID, ACL_PW]]));
			}
		}
	);
}

const KGEN_size = 0x20; //CONFIG
function command_KGEN(state, ID){
	// command KGEN <Device ID, Service ID>

	// Generate random key (Q: size of key?)
	var KGEN_key = crypto.randomBytes(KGEN_size).toString("hex");
	
	// Store key in redis
	// Return status
	client.set(ID, KGEN_key,
		function(err, reply){
			if(err) state.socket.write(to_errorstring("ERR key set fail"));
			else state.socket.write("+OK\r\n");
		}
	);
}

function command_GET(state, ID){
	// command GET <Device ID, Service ID>
	
	// Retrieve key from redis
	// Return key
	client.get(ID,
		function(err, reply){
			if(err) state.socket.write(to_errorstring("ERR key fetch fail"));
			else state.socket.write(to_resp(reply));
		}
	);
}

function command_DEL(state, ID){
	// command DEL <Device ID, Service ID>
	
	// Delete key from redis
	// Return status
	client.del(ID, 
		function(err, reply){
			if(err || reply <= 0) state.socket.write(to_errorstring("ERR key delete fail"));
			else state.socket.write("+OK\r\n");
		}
	);
}

function command_COMMAND(state){
	state.socket.write(to_resp(Object.keys(COMMAND)));
}

var COMMAND = {
	command: {
		action: command_COMMAND,
	}, 
	auth: {
		action: command_AUTH,
	},
	kgen: {
		action: command_KGEN,
	},
	get: {
		action: command_GET,
	},
	del: {
		action: command_DEL,
	},
};

function HandleRequest(request, state){
	console.error(`received request from conn ${state.connid}:`, JSON.stringify(to_resp(request).toString()));

	if(!(request instanceof Array) || request.length < 1){
		state.write(to_errorstring("ERR COMMAND MUST BE AN ARRAY"));
		return;
	}
	var command = request[0].toString().toLowerCase();

	// check type error according to command
	var actionentry = COMMAND[command];
	if(actionentry) actionentry.action(state, ... request.slice(1));
	else state.write(to_errorstring("ERR UNDEFINED COMMAND"));
}

module.exports.HandleRequest = HandleRequest;
