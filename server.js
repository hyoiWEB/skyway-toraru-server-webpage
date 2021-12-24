'use strict';

const express = require('express');
const socketIO = require('socket.io');
const OneSignal = require('onesignal-node');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const path = require('path');

const server = express()
  .use(express.static(path.join(__dirname, 'public')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);
const client = new OneSignal.Client('1308fc8f-2338-4f2e-92ec-a52bde4dbf1c','ZTA0Y2IzZjYtY2UzNS00MzJmLTg2NmItODNkNmZkZmFhZWE5');

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on("sendMessageToServer", function (data) {

      var frontPeer = JSON.parse(data);

      let notification = {
      contents: {
        'ja': '新しい着信',
        'en': 'New call',
      },
      included_segments: ['Subscribed Users'],
      channel_for_external_user_ids: "push",
      //include_external_user_ids: [`${data}`],
      filters: [
          {"field": "tag","key": "PeerID","relation": "=","value": `${frontPeer}`}
        ]
    };

      console.log(notification);
      client.createNotification(notification)
    console.log("送信しました。")

    });


  socket.on('Token', function(peer,token){
　　
    var peer = JSON.parse(peer);
    var token = JSON.parse(token);

    try {
      (async () =>{
      const response = await client.addDevice({
        tags:{"PeerID":`${peer}`},
        device_type: '0',
        identifier: `${token}`,
      });
      console.log(response.body);
      })()
    } catch (e) {
      if (e instanceof OneSignal.HTTPError) {
        // When status code of HTTP response is not 2xx, HTTPError is thrown.
        console.log(e.statusCode);
        console.log(e.body);
      }
    }

    console.log("データを受け取りました");
    console.log(peer);
    console.log(token);
  });

  socket.on("Terminate", function (peer,token) {

    var token = JSON.parse(token);

    try {
      (async () =>{
      const response = await client.addDevice({
        tags:{"PeerID":`${peer}`},
        device_type: '0',
        identifier: `${token}`,
      });
      console.log(response.body);
      })()
    } catch (e) {
      if (e instanceof OneSignal.HTTPError) {
        // When status code of HTTP response is not 2xx, HTTPError is thrown.
        console.log(e.statusCode);
        console.log(e.body);
      }
    }

    console.log("デバイスがオフラインであることを検知しました");
    console.log(peer);
    console.log(token);
  });

  socket.on('androidToken', function(peer,token){
　　
    var jsonPeer = JSON.parse(peer);
    var jsonToken = JSON.parse(token);

    var peer = jsonPeer.peerID
    var token = jsonToken.deviceToken

     try {
       (async () =>{
       const response = await client.addDevice({
         tags:{"PeerID":`${peer}`},
         device_type: '1',
         test_type: '1',
         identifier: `${token}`,
       });
       console.log(response.body);
       })()
     } catch (e) {
       if (e instanceof OneSignal.HTTPError) {
         // When status code of HTTP response is not 2xx, HTTPError is thrown.
         console.log(e.statusCode);
         console.log(e.body);
       }
     }

    console.log("データを受け取りました");
    console.log(peer);
    console.log(token);
  });

  socket.on("disconnect", function () {
      console.log('接続が切れました。');
    });

});