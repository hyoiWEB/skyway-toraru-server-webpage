/* eslint-disable require-jsdoc */
var key = 'camera1234';
var match = location.search.match(/key=(.*?)(&|$)/);
const messages = document.getElementById('datadisplay');
const sendTrigger = document.getElementById('sendbutton');
const localText = document.getElementById('textbox');

if(match) {
    key = match[1];
}

$(function() {
  // Peer object
  const peer = new Peer({
    key:   "6ffb6f8b-4291-49d3-8558-d4b3f3309b48",
    debug: 3,
  });

  let localStream;
  let existingCall;
  var errorMessage;
  //ループ処理回避用
  var callAccept = true;
  var sended = false;
  var remakeCall = true;

  var timerId = setTimeout(timeout, 60000);

  //タイムアウトの処理
  function timeout() {
    console.log('timeout-end-call');
    //タイマーを終了する
    clearTimeout(timerId);
    remakeCall = false;
    //通信を中断する
    existingCall.close();
    step2();
    callAccept = false;
    alert('＜＜＜＜通知＞＞＞＞\n相手が応答しませんでした。\nこの画面を閉じるか最初に戻ってお手続きをお願いします。');
  }

  // Receiving datachannel
  var conn;
  peer.on('connection', function(c) {
    console.log('connection');
    conn = c;
          conn.on('data', data => {
            document.getElementById('datadisplay').textContent += 'Remote: '+ data +'\n';
          });
  });

  peer.on('open', () => {
    console.log('open');
    $('#my-id').text(peer.id);
    step1();
    document.getElementById('sendbutton').addEventListener('click', onClickSend);
  });

  // Receiving a call
  peer.on('call', call => {
    if (callAccept){
      console.log('call');
      call.answer(localStream);
      step3(call);
      dataconnection(call.remoteId);
    }else{
      console.log('callが拒否されました');
    }
  });

  function onClickSend() {
    console.log('onClickSend');
    const data = document.getElementById('textbox').value;
    if(conn){
        conn.send(data);
        document.getElementById('datadisplay').textContent += 'You: '+ data +'\n';
        document.getElementById('textbox').value = '';
    }else{
        alert('error : cant send');
    }
  }

  peer.on('data', ({ name, msg }) => {
    document.getElementById('datadisplay').textContent += 'Remote: '+'\n';
    alert('peer');
  });

  function dataconnection(calltoid){
    console.log('dataconnection');
      conn = peer.connect(calltoid);
      if(conn){
        conn.on('data', ({ name, msg }) => {
          console.log('data:',`${name}: ${msg}`);
          clearTimeout(timerId);
        document.getElementById('datadisplay').textContent += 'Remote: '+'\n';
        });
      }else{
          alert('NG');
      }
  }

  // receive data event
  peer.on('data', function(data){
    switch (data.type) {
      case 'reject':
      call.close();
      conn.close();
      alert("拒否されました");
      //step2();
      return;
    }
  });

  peer.on('error', err => {
    if (remakeCall == true) {
      $('#call').click();
    }
  });

  peer.on('close', err => {
    if(errorMessage!=err.message){
      alert('＜＜＜＜通知＞＞＞＞\n接続エラーが発生しました。\nこの画面を閉じるか最初に戻ってお手続きをお願いします。\n詳細:'+err.message);
         }
    errorMessage=err.message;
  });

  //電話かける
  $('#make-call').on('submit', e => {
    if (callAccept){
      console.log('make-call');
      e.preventDefault();
      console.log($('#callto-id').val());
      const call = peer.call($('#callto-id').val(), localStream);
      dataconnection($('#callto-id').val());
      step3(call);
    }else{
      console.log('make-callが拒否されました');
    }
  });

  $('#end-call').on('click', () => {
    console.log('end-call');
    existingCall.close();
    step2();
    callAccept = false;
    setTimeout("window.close()", 2000);
  });

  $('#step1-retry').on('click', () => {
    console.log('step1-retry');
    $('#step1-error').hide();
    step1();
  });

  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
      selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
          select.remove(children);
        }
      });

      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
          option.text(deviceInfo.label ||
            'Microphone ' + (audioSelect.children().length + 1));
          audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text(deviceInfo.label ||
            'Camera ' + (videoSelect.children().length + 1));
          videoSelect.append(option);
        }
      }

      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
          return n.value === values[selectorIndex];
        })) {
          select.val(values[selectorIndex]);
        }
      });

      videoSelect.on('change', step1);
      audioSelect.on('change', step1);
    });

  function step1() {
    console.log('step1');
    const audioSource = $('#audioSource').val();
    const videoSource = $('#videoSource').val();
    const constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined},
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      $('#my-video').get(0).srcObject = stream;
      localStream = stream;

      if (existingCall) {
        existingCall.replaceStream(stream);
        return;
      }

      step2();
    }).catch(err => {
      $('#step1-error').show();
      console.error(err);
    });
  }

  function step2() {
    console.log('step2');
    $('#step1, #step3').hide();
    $('#step2').show();

    console.log("接続可否",callAccept);
    if (callAccept){
      $('#callto-id').focus();
      $('#callto-id').val(key);
      $('#call').click();

      let frontPeer = JSON.stringify(call.remoteId);
      socket = io.connect("https://onesignal-server-test.herokuapp.com/");

      socket.on('connect', () => {
      console.log('connect');

          socket.emit("sendMessageToServer", frontPeer);
          console.log('送信しました。');
      });

    }else{
      alert('＜＜＜＜通知＞＞＞＞\n接続が切れました。\n再接続する場合は更新してください。'); 
      setTimeout("window.close()", 2000);
    }
  }

  function step3(call) {
    console.log('step3');
    if (existingCall) {
      console.log('接続エラー');
    }

    call.on('stream', stream => {
      console.log('get their-video');
      const el = $('#their-video').get(0);
      el.srcObject = stream;
      console.log("ストリーム詳細",stream);
      el.play();
    });

    existingCall = call;
    $('#their-id').text(call.remoteId);
    
    call.on('close', () => {
      callAccept = false;
      step2();
    });
    call.on('error', () => {
      alert('現在、他の方が繋げています。少し待ってから更新してお繋ぎください！');
      callAccept = false;
      step2();
    });

    $('#step1, #step2').hide();
    $('#step3').show();
  }
});