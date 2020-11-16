/// ////////////////////////////////////////////////////
//
// File: confo.js
// This is the main application file for client end point. It tries to use Enablex Web Toolkit to
// communicate with EnableX Servers
//
// Last Updated: 29-11-2018
// Reformat, Indentation, Inline Comments
//
/// //////////////////////////////////////////////////
let faceAI = null;
let faceComp = null;
let isCheckSimilarity = false;
let selectedImage = [];
let selectedImgIndex = 0;
let faceAIRunning = false;
let ATList = [];
const faceConfig = {
  maxInputFrameSize: 160,
  smoothness: 0.99,
  enableBalancer: false,
  threshold: 0.7,
  fullFrameDetection: true,
};

let isAppendFaceDetail = false;
const faceTrackingData = {
  attention: null,
  age: null,
  gender: null,
  pose: null,
  face: null,
  liveness: '',
  similarity: '',
};
const imgURL = null;
let isCheckLiveness = false;
const facesURL = [];

let localStream = null;
let username = null;
let room;
const SUPPORT_URL = 'https://enablex.io';
// Player Options
const options = {
  id: 'vcx_1001',
  attachMode: '',
  player: {
    autoplay: '',
    name: '',
    nameDisplayMode: '',
    frameFitMode: 'bestFit',
    skin: 'classic',
    class: '',
    height: 'inherit',
    width: 'inherit',
    minHeight: '120px',
    minWidth: '160px',
    aspectRatio: '',
    volume: 0,
    media: '',
    loader: {
      show: false,
      url: '/img/loader.gif',
      style: 'default',
      class: '',
    },
    backgroundImg: '/img/player-bg.gif',
  },
  toolbar: {
    displayMode: 'auto',
    autoDisplayTimeout: 0,
    position: 'top',
    skin: 'default',
    iconset: 'default',
    class: '',
    buttons: {
      play: false,
      share: false,
      mic: false,
      resize: false,
      volume: false,
      mute: false,
      record: false,
      playtime: false,
      zoom: false,
    },
    branding: {
      display: false,
      clickthru: 'https://www.enablex.io',
      target: 'new',
      logo: '/img/enablex.png',
      title: 'EnableX',
      position: 'right',
    },
  },
};
/* Face config for face detection */
function config() {
  return `{  
"runtime": {  
  "accept_threshold": 0.89,  
  "associate_threshold": 0.5,  
  "split_threshold": 0.015,  
  
  }   
}`;
}
let binarystring; // Global intentionally
const customizedConfig = {
  customConfig: config(),
};
window.onload = function () {
  $('#faces_snapshot').hide();
  $('#compare_div').hide();
  faceAI = new EnxFaceAI();
  faceComp = new EnxFaceCompare();

  // URL Parsing to fetch Room Information to join
  const parseURLParams = function (url) {
    const queryStart = url.indexOf('?') + 1;
    const queryEnd = url.indexOf('#') + 1 || url.length + 1;
    const query = url.slice(queryStart, queryEnd - 1);
    const pairs = query.replace(/\+/g, ' ').split('&');
    const parms = {};
    let i;
    let n;
    let v;
    let nv;

    if (query === url || query === '') return;

    for (i = 0; i < pairs.length; i++) {
      nv = pairs[i].split('=', 2);
      n = decodeURIComponent(nv[0]);
      v = decodeURIComponent(nv[1]);

      if (!parms.hasOwnProperty(n)) parms[n] = [];
      parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
  };
  const urlData = parseURLParams(window.location.href);
  const name = urlData.user_ref[0];
  // Local Stream Definition
  const config = {
    audio: true,
    video: { deviceId: localStorage.getItem('cam') },
    data: true,
    videoSize: [320, 180, 640, 480],
    options,
    attributes: {
      name,
    },
  };

  let countStream = 0;

  const localStreamId = null;

  const setLiveStream = function (stream, remoteData) {
    // Listening to Text Data
    stream.addEventListener('stream-data', (e) => {
      const text = e.msg.textMessage;
      const html = $('.multi_text_container_div').html();
      $('#multi_text_container_div').html(`${html + text}<br>`);
    });
    const name = stream.getAttributes().name !== undefined
      ? stream.getAttributes().name
      : '';
    if (!stream.local) {
      const newStreamDiv = document.createElement('div');
      newStreamDiv.setAttribute('id', remoteData.clientId);
      newStreamDiv.setAttribute('class', 'live_stream_div col-md-3 col-sm-3');
      var nameDiv = document.createElement('div');
      nameDiv.setAttribute('id', `title_${remoteData.clientId}`);
      nameDiv.setAttribute('class', 'name-div');
      nameDiv.innerHTML = remoteData.name;
      newStreamDiv.appendChild(nameDiv);
      const multi_video_div = document.getElementById(
        'multi_video_container_div',
      );
      multi_video_div.appendChild(newStreamDiv);
      options.player.height = 'inherit';
      options.player.width = 'inherit';
      options.player.class = 'test_class';

      stream.show(remoteData.clientId, options);
      countStream++;
    } else {
      options.player.height = 'inherit';
      options.player.width = 'inherit';
      options.player.loader.class = '';
      options.player.loader.show = false;
      const controlsDiv = document.getElementById('controls-div');
      controlsDiv.style.display = 'block';
      var nameDiv = document.createElement('div');
      nameDiv.setAttribute('class', 'name-div');
      nameDiv.innerHTML = name;
      document.getElementById('local_video_div').appendChild(controlsDiv);
      document.getElementById('local_video_div').appendChild(nameDiv);
      stream.show('local_video_div', options);
    }
  };

  // Function: To create user-json for Token Request

  const createDataJson = function (url) {
    const urlData = parseURLParams(url);
    username = urlData.user_ref[0];
    const retData = {
      name: urlData.user_ref[0],
      role: urlData.usertype[0],
      roomId: urlData.roomId[0],
      user_ref: urlData.user_ref[0],
    };
    return retData;
  };

  // Function: Create Token

  createToken(createDataJson(window.location.href), (response) => {
    const token = response;

    // JOin Room
    localStream = EnxRtc.joinRoom(token, config, (response, error) => {
      if (error && error != null) {
      }
      if (response && response != null) {
        room = response.room;
        const ownId = response.publishId;
        setLiveStream(localStream);
        for (let i = 0; i < response.streams.length; i++) {
          room.subscribe(response.streams[i]);
        }
        // for face tracking
        faceAI.init(response, localStream, (res) => {
          console.log(res, 'init result');
          if (res.result === 0) {
            startFaceTrack();
          }
        });

        room.addEventListener('connected', (event) => {
          console.log(event, 'event');
        });
        // Active Talker list is updated
        room.addEventListener('active-talkers-updated', (event) => {
          ATList = event.message.activeList;
          document
            .querySelectorAll('.classic_vcx_stream')
            .forEach((item) => {
              item.classList.remove('border-b-active');
            });
          const video_player_len = document.querySelector(
            '#multi_video_container_div',
          ).childNodes;
          if (
            event.message
            && event.message !== null
            && event.message.activeList
            && event.message.activeList !== null
          ) {
            if (ATList.length == video_player_len.length) {
              return;
            }
            document.querySelector('#multi_video_container_div').innerHTML = '';
            for (stream in room.remoteStreams.getAll()) {
              const st = room.remoteStreams.getAll()[stream];
              for (j = 0; j < ATList.length; j++) {
                if (ATList[j].streamId == st.getID()) {
                  const remoteData = ATList[j];
                  setLiveStream(st, remoteData);
                }
              }
            }
          }

          if (ATList !== null && ATList.length) {
            const active_talker_stream = ATList[0].streamId;

            document
              .getElementById(`stream${active_talker_stream}`)
              .classList.add('border-b-active');
          }
          console.log(`Active Talker List :- ${JSON.stringify(event)}`);
        });

        // Stream has been subscribed successfully
        room.addEventListener('stream-subscribed', (streamEvent) => {
          const stream = streamEvent.data && streamEvent.data.stream
            ? streamEvent.data.stream
            : streamEvent.stream;
          for (k = 0; k < ATList.length; k++) {
            if (ATList[k].streamId == stream.getID()) {
              const remoteData = ATList[k];
              setLiveStream(stream, remoteData);
            }
          }
        });

        room.addEventListener('user-disconnected', (event) => {
          console.log(e);
          faceAIRunning = false;
        });

        // Listening to Incoming Data
        room.addEventListener('active-talker-data-in', (data) => {
          console.log(`active-talker-data-in${data}`);
          const obj = {
            msg: data.message.message,
            timestamp: data.message.timestamp,
            username: data.message.from,
          };
          // Handle UI to display message
        });

        // Stream went out of Room
        room.addEventListener('stream-removed', (event) => {
          console.log(event);
        });

        // Listening to face data
        room.addEventListener('user-data-received', (event) => {
          const data = event.message;
          const itemDiv = document.getElementById(`title_${data.senderId}`); // .innerHTML = evt.detail.output.attention.toFixed(2);
          if (itemDiv) {
            itemDiv.innerHTML = `${data.sender} (attention=${data.message.value.attention})`;
          }
          // console.log(data, "faceTrackingData");
        });
      }
    });
  });
};

function audioMute() {
  const elem = document.getElementsByClassName('icon-confo-mute')[0];
  const onImgPath = '../img/mike.png';
  const onImgName = 'mike.png';
  const offImgPath = '../img/mute-mike.png';
  const offImgName = 'mute-mike.png';
  const currentImgPath = elem.src.split('/')[elem.src.split('/').length - 1];
  if (currentImgPath === offImgName) {
    localStream.unmuteAudio((arg) => {
      elem.src = onImgPath;
      elem.title = 'mute audio';
    });
  } else if (currentImgPath === onImgName) {
    localStream.muteAudio((arg) => {
      elem.src = offImgPath;
      elem.title = 'unmute audio';
    });
  }
}
function videoMute() {
  const elem = document.getElementsByClassName('icon-confo-video-mute')[0];
  const onImgPath = '../img/video.png';
  const onImgName = 'video.png';
  const offImgPath = '../img/mute-video.png';
  const offImgName = 'mute-video.png';
  const currentImgPath = elem.src.split('/')[elem.src.split('/').length - 1];
  if (currentImgPath === offImgName) {
    localStream.unmuteVideo((res) => {
      const streamId = localStream.getID();
      const player = document.getElementById(`stream${streamId}`);
      player.srcObject = localStream.stream;
      player.play();
      elem.src = onImgPath;
      elem.title = 'mute video';
    });
  } else if (currentImgPath === onImgName) {
    localStream.muteVideo((res) => {
      elem.src = offImgPath;
      elem.title = 'unmute video';
    });
  }
}

function endCall() {
  const r = confirm('Are you really want to Quit??');
  if (r == true) {
    window.location.href = SUPPORT_URL;
  }
}
function checkLiveness() {
  alert('Please move your face right slowely');
  isCheckLiveness = true;
  faceTrackingData.liveness = '';
}

function resetLiveness() {
  isCheckLiveness = false;
  faceTrackingData.liveness = '';
  $('#compare_div').hide();
  faceTrackingData.similarity = '';
  ('selected_image0');
  document.getElementById('selected_image0').innerHTML = '';
  document.getElementById('selected_image1').innerHTML = '';
  selectedImage = [];
}
function appendFaceDetail() {
  isAppendFaceDetail = true;

  setInterval(() => {
    document.getElementById('face_attention').innerHTML = `
      <h4>Attention: ${faceTrackingData.attention}</h4>
      <h4>Age: ${faceTrackingData.age}</h4>
      <h4>Gender: ${faceTrackingData.gender}</h4>
      <h4>Pose: ${faceTrackingData.pose}</h4>
      <h4>Liveliness: ${faceTrackingData.liveness}</h4>
      <h4>Similarity: ${faceTrackingData.similarity}</h4>
      `;
  }, 1000 / 3);
  $('#faces_snapshot').show();
  setInterval(() => {
    if (facesURL.length) {
      $('#face_image').empty();
      for (let i = 0; i < facesURL.length; i++) {
        const image = new Image();
        image.id = `face_${i}`;
        image.src = facesURL[i].url;
        image.onclick = function () {
          return selectImage(image);
        };
        image.style.backgroundRepeat = 'no-repeat';
        image.style.marginLeft = '5px';
        image.style.marginTop = '5px';
        image.style.border = '2px solid black';
        image.style.borderRadius = '10px';
        image.style.cursor = 'pointer';
        $('#face_image').append(image);
      }
    }
  }, 2000);
}
function selectImage(img) {
  selectedImage[selectedImgIndex] = img;
  const container = document.createElement('span');
  document.getElementById(`selected_image${selectedImgIndex}`).innerHTML = '';
  document
    .getElementById(`selected_image${selectedImgIndex}`)
    .append(container);
  container.append(selectedImage[selectedImgIndex]);
}

function imagedata_to_image(imagedata) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imagedata.width;
  canvas.height = imagedata.height;
  ctx.putImageData(imagedata, 0, 0);
  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

function startFaceTrack() {
  faceAI.startFaceDetector({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-detector', (evt) => {
        // console.log(evt.detail, "face detector event...........");
        const { faces } = evt.detail;
        faceTrackingData.face = faces.length;
        if (facesURL.length === 5) {
          facesURL.splice(0, evt.detail.faces.length);
        }
        // facesURL = [];
        if (evt.detail.faces.length) {
          for (let i = 0; i < evt.detail.faces.length; i++) {
            const binarystring = imagedata_to_image(evt.detail.faces[i]);
            facesURL.push({
              url: binarystring.src,
              width: evt.detail.faces[i].width,
              height: evt.detail.faces[i].height,
            });
          }
        }
        // room.sendUserData(MessageOpt, true);
        if (!isAppendFaceDetail) {
          appendFaceDetail();
        }
      });
    }
  });
  faceAI.startFacePose({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-pose', (evt) => {
        // console.log(evt.detail, "face pose event...........");
        const pitch = evt.detail.output.pose.pitch.toFixed(2);
        const yaw = evt.detail.output.pose.yaw.toFixed(2);
        // const roll = evt.detail.output.pose.yaw.toFixed(2);

        if (yaw > 0.2 || yaw < -0.2 || pitch > 0.2 || pitch < -0.2) faceTrackingData.pose = 'Please look into the camera';
        else faceTrackingData.pose = 'Good';

        if (isCheckLiveness) {
          if (yaw < -0.1) {
            faceTrackingData.liveness = 'You are Live';
            isCheckLiveness = false;
          } else {
            faceTrackingData.liveness = 'Not Live';
          }
        }
      });
    }
  });
  faceAI.startFaceAge({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-age', (evt) => {
        // console.log(evt.detail, "face age event...........");
        const age = Math.ceil(evt.detail.output.numericAge / 5) * 5;
        faceTrackingData.age = `${age - 5}-${age}`;
      });
    }
  });
  faceAI.startFaceEmotion({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-emotion', (evt) => {
        // console.log(evt.detail, "face emotion event...........");
      });
    }
  });
  faceAI.startFaceGender({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-gender', (evt) => {
        // console.log(evt.detail, "face gender event...........");
        faceTrackingData.gender = evt.detail.output.mostConfident;
      });
    }
  });
  faceAI.startFaceFeatures({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-features', (evt) => {
        // console.log(evt.detail, "face features event...........");
      });
    }
  });
  faceAI.startFaceArousalValence({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-arousal-valence', (evt) => {
        // console.log(evt.detail, "face arousal-valence event...........");
      });
    }
  });
  faceAI.startFaceAttention({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-attention', (evt) => {
        // console.log(evt.detail, "face attention event...........");
        const attention = evt.detail.output.attention.toFixed(2);
        if (attention < 0.2) faceTrackingData.attention = 'Very Low';
        else if (attention > 0.2 && attention < 0.4) faceTrackingData.attention = 'Low';
        else if (attention > 0.4 && attention < 0.6) faceTrackingData.attention = 'Medium';
        else if (attention >= 0.6) faceTrackingData.attention = 'High';
      });
    }
  });
}

$('#Pic_Taker').click(function () {
  $(this).data('clicked', true);
});

function checkSimilarity() {
  $('#compare_div').show();
  if (isCheckSimilarity) {
    return;
  }
  isCheckSimilarity = true;
  document
    .getElementById('compare_face_click')
    .addEventListener('click', async () => {
      if (selectedImage.length !== 2) {
        alert('select any 2 image for compare');
        return;
      }
      faceTrackingData.similarity = '...loading';
      const compareData = {
        imgURL: selectedImage[0],
        compareImgURL: selectedImage[1],
        modelURL: '/models',
      };
      faceComp.checkSimilarity(compareData, (res) => {
        if (res.result === 0) {
          if (res.data <= 0.5) {
            faceTrackingData.similarity = 'Face Matched';
          } else {
            faceTrackingData.similarity = 'Face Not Matched';
          }
          alert(res.data);
        }
      });
    });
}

function changeSelectedImage(index) {
  selectedImgIndex = index;
}
function stopFaceTracking() {
  faceAI.stopFaceDetector((evt) => {
    debugger;
    console.log(evt, 'stop face pose evt..............');
  });
}

function startFaceEmo() {
  faceAI.startFaceEmotion({}, (res) => {
    if (res.result === 0) {
      window.addEventListener('face-emotion', (evt) => {
        console.log(evt.detail, 'face emotion event...........');
      });
    }
  });
}

function stopFaceEmo() {
  faceAI.stopFaceEmotion((evt) => {
    debugger;
    console.log(evt, 'stop face emotion evt..............');
  });
}
