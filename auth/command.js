
const fs = require("fs");
const crypto = require("crypto");
const forge = require("node-forge");

const { to_resp, to_errorstring } = require("./redis-format");

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
		function(err, res){
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

const globals = {
	timestamp: Date.now(),

};

function command_AUTH(reply, reporterror, ID){
	// command AUTH <Device ID, Service ID>

	// Step 1 RA (deprecated, verification on connection startup)
//	if(false && !state.authenticated){
//		let peercertobj = state.socket.getPeerCertificate();
//		if(peercertobj.raw && ias.verify_cert(peercertobj)){
//			state.authenticated = true;
//		}
//
//		if(!state.authenticated){
//			// open ra subsession
//			// okay to refuse
//			// TODO
//			// state.socket.write(to_errorstring("ERROR NOT AUTHENTICATED"));
//			// accept unauthorized for now
//		}
//	}
	
	// Step 2 Authorize access to redis by give ACL permission
	var ACL_ID;
	let now = Date.now();
	if(globals.timestamp < now){
		ACL_ID = now.toString();
		globals.timestamp = now;
	} else{
		ACL_ID = ++globals.timestamp;
	}

	var ACL_PW = crypto.randomBytes(32).toString("hex");
	let ACL_PWHASH = crypto.createHash("SHA256").update(ACL_PW).digest().toString("hex");
	
	// Return ACL ID/PW
	client.acl("setuser", ACL_ID, "on", '#'+ACL_PWHASH, "~*", "resetchannels", "+get", "+info",
		function(err, res){
			if(err){
				reply(to_errorstring("ERR user creation fail"));
				reporterror(err);
			} else{
				reply(to_resp(["OK", [ACL_ID, ACL_PW]]));
			}
		}
	);
}

const KGEN_size = 0x20; //CONFIG
function command_KGEN(reply, reporterror, ID){
	// command KGEN <Device ID, Service ID>

	// Generate random key (Q: size of key?)
	var KGEN_key = crypto.randomBytes(KGEN_size).toString("hex");
	
	// Store key in redis
	// Return status
	client.set(ID, KGEN_key,
		function(err, res){
			if(err){
				reply(to_errorstring("ERR key set fail"));
				reporterror(err);
			} else reply("+OK\r\n");
		}
	);
}

function command_GET(reply, reporterror, ID){
	// command GET <Device ID, Service ID>
	
	// Retrieve key from redis
	// Return key
	client.get(ID,
		function(err, res){
			if(err){
				reply(to_errorstring("ERR key fetch fail"));
				reporterror(err);
			} else reply(to_resp(res));
		}
	);
}

function command_DEL(reply, reporterror, ID){
	// command DEL <Device ID, Service ID>
	
	// Delete key from redis
	// Return status
	client.del(ID, 
		function(err, res){
			if(err){
				reply(to_errorstring("ERR key delete fail"));
				reporterror(err);
			} else reply(to_resp(res));
		}
	);
}

function command_COMMAND(reply, reporterror){
	reply(to_resp(Object.keys(COMMAND)));
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

function HandleRequest(request, reply, reporterror){
	if(!(request instanceof Array) || request.length < 1){
		reply(to_errorstring("ERR command must be an array"));
		return;
	}
	var command = request[0].toString().toLowerCase();

	// check type error according to command
	var actionentry = COMMAND[command];
	if(actionentry) actionentry.action(reply, reporterror, ... request.slice(1));
	else reply(to_errorstring("ERR undefined command"));
}

module.exports.HandleRequest = HandleRequest;
