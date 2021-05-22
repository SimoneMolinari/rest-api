// index.js

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const fs = require('fs');


var key = fs.readFileSync('/dati/certs/private.key');
var ca = fs.readFileSync('/dati/certs/ca_bundle.crt');
var cert = fs.readFileSync('/dati/certs/certificate.crt');
var options = {
  key: key,
  ca: ca,
  cert: cert
};

// set up port
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cors());

// add routes
const router = require('./routes/router.js');
app.use('/api', router);

var server = https.createServer(options, app);

// run server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
