const fs = require("fs");
const tls = require("tls");

const RedisParser = require("redis-parser");
const { to_errorstring } = require("./redis-format");

const { HandleRequest } = require("./command");

const port = 6380;

const creds = {
	key: fs.readFileSync("sp_cert_key.pem"),
	cert: fs.readFileSync("sp_cert.crt"),
	
	// later verified
	rejectUnauthorized: false,
	requestCert: true,
};

var last;
var connid = 0;

const server = tls.createServer(creds,
		function(socket){
			console.log(`connection ${connid} established`,
				socket.authorized ? "authorized" : "unauthorized",
				"with certificate",
				JSON.stringify(socket.getPeerCertificate())
				);
			last = socket;

			var state = {
				socket: socket,
				resp: new RedisParser({
					returnReply: function(reply){
						HandleRequest(reply, state);
					},
					returnError: function(err){
						socket.write(to_errorstring("ERROR PARSE INVALID"));
						this.reset();
					},
					returnBuffers: true,
				}),
				write: function(data){
					socket.write(data);
				}, 
				connid: connid++,
			};

			socket.on("data", 
				function(indata){
					console.error(`received data from conn ${state.connid}:`, 
						JSON.stringify(indata.toString()));
					state.resp.execute(indata);
				}
			);

			socket.on("error",
				function(error){
					console.error("error", error);
				}
			);
		}
	);

server.listen(port, function(){ console.log(`server listening at port ${port}`); });
