const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');

const iotHubConnectionString ="HostName=ACLCHENNAI.azure-devices.net;;SharedAccessKeyName=service;SharedAccessKey=F/0GZB966G+VPa1HtjBucGDozfgH6FtqjPYo4WTzVGU="

//HostName=KTAI.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=L2IDJe5yizp79RqkRH3ZkIQZZnD9V7Qgkzx7fevMyV8="

//;SharedAccessKeyName=iothubowner;SharedAccessKey=L2IDJe5yizp79RqkRH3ZkIQZZnD9V7Qgkzx7fevMyV8=;EntityPath=ktai
//"HostName=KTAI.azure-devices.net  ;SharedAccessKeyName=service;SharedAccessKey=w6ppCx3Vln2391oisgRSKXkTlcOA2JKOTNGsqSOSlss=";
     
//"HostName=KTBAGRI.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=AaYvkN3lA+HBgoiWn5byRFG6KlIE3izDdoe2pljI8d8=";

const eventHubConsumerGroup = "alca";


// Redirect requests to the public subdirectory to the root
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res /* , next */) => {
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log(`Broadcasting data ${data}`);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

server.listen(process.env.PORT || '3000', () => {
  console.log('Listening on %d.', server.address().port);
});

const eventHubReader = new EventHubReader(iotHubConnectionString, eventHubConsumerGroup);

(async () => {
  await eventHubReader.startReadMessage((message, date, deviceId) => {
    try {
      const payload = {
        IotData: message,
        MessageDate: date || Date.now().toISOString(),
        DeviceId: deviceId,
      };

      wss.broadcast(JSON.stringify(payload));
    } catch (err) {
      console.error('Error broadcasting: [%s] from [%s].', err, message);
    }
  });
})().catch();
