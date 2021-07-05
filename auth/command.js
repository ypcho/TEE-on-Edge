
const crypto = require("crypto");

const { to_resp, to_errorstring } = require("./redis-format");

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

function command_AUTH(DeviceID, ServiceID, socket){
	// command AUTH <Device ID, Service ID>

	// Step 1 RA
	
	// Step 2 Allow IP address to redis by config set bind
	// Issue: not possible
	
	// Step 3 Authorize access to redis by give ACL permission
	
	// Return ACL ID/PW
}

const KGEN_size = 0x20;
function command_KGEN(DeviceID, ServiceID, res){
	// command KGEN <Device ID, Service ID>
	
	var idencode = encode(DeviceID, ServiceID);

	// Generate random key (Q: size of key?)
	var KGEN_key = crypto.randomBytes(KGEN_size).toString("hex");
	
	// Store key in redis
	// Return status
	client.set(idencode, KGEN_key,
		function(err, reply){
			if(err) res.write(err);
			else res.write(reply);
		}
	);
}

function command_GET(DeviceID, ServiceID, res){
	// command GET <Device ID, Service ID>
	
	var idencode = encode(DeviceID, ServiceID);
	
	// Retrieve key from redis
	// Return key
	client.get(idencode,
		function(err, reply){
			if(err) res.write(err);
			else res.write(reply);
		}
	);
}

function command_DEL(DeviceID, ServiceID){
	// command DEL <Device ID, Service ID>
	var idencode = encode(DeviceID, ServiceID);
	
	// Delete key from redis
	// Return status
	client.del(idencode, 
		function(err, reply){
			if(err) res.write(err);
			else res.write(reply);
		}
	);
}

function command_COMMAND(state){
	this.socket.write(to_resp(Object.keys(COMMAND)));
}

var COMMAND = {
	command: {
		action: command_COMMAND,
	}
};

function HandleRequest(request, state){
	console.log("received request:", to_resp(request).toString());

	if(!(request instanceof Array) || request.length < 1){
		socket.write(to_errorstring("ERROR COMMAND MUST BE AN ARRAY"));
		return;
	}
	var command = request[0].toString().toLowerCase();

	// check type error according to command
	var action = COMMAND[command].action;
	if(action) action.apply(state, request.slice(1));
	else state.socket.write(to_errorstring("ERROR UNDEFINED COMMAND"));
}

module.exports.HandleRequest = HandleRequest;
