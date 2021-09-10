const fs = require("fs");
const tls = require("tls");

const RedisParser = require("redis-parser");
const { to_resp, to_errorstring } = require("./redis-format");
const ias = require("./ias");

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
var connid_counter = 0;

const server = tls.createServer(creds,
		function(socket){
			var connid = connid_counter++;
			
			console.log(`connection ${connid} established`,
				socket.authorized ? "authorized" : "unauthorized",
				"with certificate",
				JSON.stringify(socket.getPeerCertificate())
				);
			last = socket;

			var state = {
				socket: socket,
				connid: connid,

//				work_queue: {
//					busy: true, // initialize true for RA
//					cmd_queue: [],
//					/*
//						{
//							resolved: is response acquired? (yes: send response, no: handle request)
//							request: request command, may be absent if already resolved,
//							response: response to send, present if resolved === true
//						}
//
//					*/
//
//					execute: function(){
//						while(!this.busy && this.cmd_queue.length > 0){
//							let work = this.cmd_queue.shift();
//							if(work.resolved){
//								// send response
//								if(work.response instanceof String) socket.write(work.response);
//								else console.error(`connection ${state.connid} workload malformed`, work);
//							} else{
//								// resolve request
//								this.busy = true;
//								HandleRequest(work.request, state, 
//									function(res){
//										this.busy = false;
//										socket.write(res);
//										this.execute();
//									}
//								);
//								break;
//							}
//						}
//					},
//					push_request: function(req){
//						this.cmd_queue.push({ resolved: false, request: req, });
//					},
//					push_error: function(err){
//						this.cmd_queue.push({ resolved: true, response: err, });
//
//					}
//				},
			};

			var work = new Promise(
				function(resolve, reject){
					ias.verify_cert(socket.getPeerCertificate(),
						function(warn){
							console.log(`connection ${connid} certificate successfully verified`);
							if(warn){
								console.log(`connection ${state.connid} certificate received ias warning:`, warn);
							}
							//success
							resolve();
						},
						function(err){
							console.log(`connection ${state.connid} ra verification failed:`, err);
							console.log(`closing connection ${state.connid}`);

							socket.write(to_errorstring("ERR invalid certificate"));
							socket.end();

							// failure
							// end of promise chain
							// warning: do not resolve or reject to clear promise chain
							// reference: https://stackoverflow.com/questions/20068467/does-never-resolved-promise-cause-memory-leak
						}
					);
				}
			);

			var resp = new RedisParser({
				returnReply: function(command){
					// hold if busy here by command granularity
					console.error(`connection ${connid} received request:`, 
							JSON.stringify(to_resp(command).toString("binary")));
					work = work.then(
						function(){
							return new Promise(
								function(resolve, reject){
									try{
										// resolve if reply acquired
										// reject on error (reply not acquirable)
										HandleRequest(command, 
											function(message){
												try{
													socket.write(message);
													console.log(`connection ${connid} reply:`, JSON.stringify(message.toString("binary")));
													resolve();
												} catch(e){
													reject(e);
												}
											}
										, reject);
									} catch(e){
										reject(e);
									}
								}
							);
						}
					).catch(
						function(reason){
							console.error(`connection ${state.connid} exception occurred:`, reason);
						}
					);
				},
				returnError: function(err){
					console.error(`connection ${connid} parse error occurred:`, err);
					work = work.then(
						function(){
							socket.write(to_errorstring("ERR parse invalid"));
						}
					).catch(
						function(reason){
							console.error(`connection ${state.connid} exception occurred:`, reason);
						}
					);
					this.reset();
				},
				returnBuffers: true,
			});

			socket.on("data", 
				function(indata){
					console.error(`received data from connection ${state.connid}:`, 
						JSON.stringify(indata.toString()));

					resp.execute(indata);
				}
			);

			socket.on("error",
				function(error){
					console.error(`error on connection ${state.connid}`, error);
				}
			);

		}
	);

server.listen(port, function(){ console.log(`server listening at port ${port}`); });
