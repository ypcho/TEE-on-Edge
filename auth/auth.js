const http = require("http");
const https = require("https");
const fs = require("fs");
const express = require("express");

const config = {
	port_http: 3000,
	port_https: 3001,
};

const creds = {
	key: fs.readFileSync("key.pem"),
	cert: fs.readFileSync("cert.pem"),
};

var app = express();

// express config
app.get('/', (req, res) => {
  res.send('Hello World!')
})
// express config end

//app.listen(port, () => {
//  console.log(`Example app listening at http://localhost:${port}`)
//})

var httpServer = http.createServer(app);
var httpsServer = https.createServer(creds, app);

httpServer.listen(config.port_http);
httpsServer.listen(config.port_https);
