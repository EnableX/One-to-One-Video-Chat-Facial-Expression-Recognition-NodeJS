///////////////////////////////////////////////////////
//
// File: confo.js
// This is the main application file for client end point. It tries to use Enablex Web Toolkit to
// communicate with EnableX Servers
//
// Last Updated: 29-11-2018
// Reformat, Indentation, Inline Comments
//
/////////////////////////////////////////////////////
let faceX = null;
let facexRunning = false;
var ATList = [];
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
  liveness: "",
};
let imgURL = null;
let isCheckLiveness = false;
let facesURL = [];

var localStream = null;
var username = null;
var room;
var SUPPORT_URL = "https://enablex.io";
// Player Options
var options = {
  id: "vcx_1001",
  attachMode: "",
  player: {
    autoplay: "",
    name: "",
    nameDisplayMode: "",
    frameFitMode: "bestFit",
    skin: "classic",
    class: "",
    height: "inherit",
    width: "inherit",
    minHeight: "120px",
    minWidth: "160px",
    aspectRatio: "",
    volume: 0,
    media: "",
    loader: {
      show: false,
      url: "/img/loader.gif",
      style: "default",
      class: "",
    },
    backgroundImg: "/img/player-bg.gif",
  },
  toolbar: {
    displayMode: "auto",
    autoDisplayTimeout: 0,
    position: "top",
    skin: "default",
    iconset: "default",
    class: "",
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
      clickthru: "https://www.enablex.io",
      target: "new",
      logo: "/img/enablex.png",
      title: "EnableX",
      position: "right",
    },
  },
};
window.onload = function () {
  $("#faces_snapshot").hide();
  faceX = new EnxFaceX();
  console.log(faceX, "ai.......");

  // URL Parsing to fetch Room Information to join
  var parseURLParams = function (url) {
    var queryStart = url.indexOf("?") + 1,
      queryEnd = url.indexOf("#") + 1 || url.length + 1,
      query = url.slice(queryStart, queryEnd - 1),
      pairs = query.replace(/\+/g, " ").split("&"),
      parms = {},
      i,
      n,
      v,
      nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
      nv = pairs[i].split("=", 2);
      n = decodeURIComponent(nv[0]);
      v = decodeURIComponent(nv[1]);

      if (!parms.hasOwnProperty(n)) parms[n] = [];
      parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
  };
  var urlData = parseURLParams(window.location.href);
  var name = urlData.user_ref[0];
  // Local Stream Definition
  var config = {
    audio: true,
    video: { deviceId: localStorage.getItem("cam") },
    data: true,
    videoSize: [320, 180, 640, 480],
    options: options,
    attributes: {
      name: name,
    },
  };

  var countStream = 0;

  var localStreamId = null;

  var setLiveStream = function (stream, remoteData) {
    // Listening to Text Data
    stream.addEventListener("stream-data", function (e) {
      var text = e.msg.textMessage;
      var html = $(".multi_text_container_div").html();
      $("#multi_text_container_div").html(html + text + "<br>");
    });
    var name =
      stream.getAttributes().name !== undefined
        ? stream.getAttributes().name
        : "";
    if (!stream.local) {
      var newStreamDiv = document.createElement("div");
      newStreamDiv.setAttribute("id", remoteData.clientId);
      newStreamDiv.setAttribute("class", "live_stream_div col-md-3 col-sm-3");
      var nameDiv = document.createElement("div");
      nameDiv.setAttribute("id", "title_" + remoteData.clientId);
      nameDiv.setAttribute("class", "name-div");
      nameDiv.innerHTML = remoteData.name;
      newStreamDiv.appendChild(nameDiv);
      var multi_video_div = document.getElementById(
        "multi_video_container_div"
      );
      multi_video_div.appendChild(newStreamDiv);
      options.player.height = "inherit";
      options.player.width = "inherit";
      options.player.class = "test_class";

      stream.show(remoteData.clientId, options);
      countStream++;
    } else {
      options.player.height = "inherit";
      options.player.width = "inherit";
      options.player.loader.class = "";
      options.player.loader.show = false;
      var controlsDiv = document.getElementById("controls-div");
      controlsDiv.style.display = "block";
      var nameDiv = document.createElement("div");
      nameDiv.setAttribute("class", "name-div");
      nameDiv.innerHTML = name;
      document.getElementById("local_video_div").appendChild(controlsDiv);
      document.getElementById("local_video_div").appendChild(nameDiv);
      stream.show("local_video_div", options);
    }
  };

  // Function: To create user-json for Token Request

  var createDataJson = function (url) {
    var urlData = parseURLParams(url);
    username = urlData.user_ref[0];
    var retData = {
      name: urlData.user_ref[0],
      role: urlData.usertype[0],
      roomId: urlData.roomId[0],
      user_ref: urlData.user_ref[0],
    };
    return retData;
  };

  // Function: Create Token

  createToken(createDataJson(window.location.href), function (response) {
    var token = response;

    // JOin Room
    localStream = EnxRtc.joinRoom(token, config, function (response, error) {
      if (error && error != null) {
      }
      if (response && response != null) {
        room = response.room;
        var ownId = response.publishId;
        setLiveStream(localStream);
        for (var i = 0; i < response.streams.length; i++) {
          room.subscribe(response.streams[i]);
        }
        //for face tracking
        faceX.init(response, localStream, (res) => {
          console.log(res, "init result");
          if (res.result === 0) {
            startFaceTrack();
          }
        });

        room.addEventListener("connected", function (event) {
          console.log(event, "event");
        });
        // Active Talker list is updated
        room.addEventListener("active-talkers-updated", function (event) {
          ATList = event.message.activeList;
          document
            .querySelectorAll(".classic_vcx_stream")
            .forEach(function (item) {
              item.classList.remove("border-b-active");
            });
          var video_player_len = document.querySelector(
            "#multi_video_container_div"
          ).childNodes;
          if (
            event.message &&
            event.message !== null &&
            event.message.activeList &&
            event.message.activeList !== null
          ) {
            if (ATList.length == video_player_len.length) {
              return;
            } else {
              document.querySelector("#multi_video_container_div").innerHTML =
                "";
              for (stream in room.remoteStreams.getAll()) {
                var st = room.remoteStreams.getAll()[stream];
                for (j = 0; j < ATList.length; j++) {
                  if (ATList[j].streamId == st.getID()) {
                    var remoteData = ATList[j];
                    setLiveStream(st, remoteData);
                  }
                }
              }
            }
          }

          if (ATList !== null && ATList.length) {
            var active_talker_stream = ATList[0].streamId;

            document
              .getElementById("stream" + active_talker_stream)
              .classList.add("border-b-active");
          }
          console.log("Active Talker List :- " + JSON.stringify(event));
          // if(!facexRunning){
          //   faceX.init(response, room.remoteStreams.get(ATList[0].streamId), (res) => {
          //     console.log(res, "init result");
          //     if (res.result === 0) {
          //       startFaceTrack();
          //       facexRunning = true;
          //     }
          //   });
          // }
        });

        // Stream has been subscribed successfully
        room.addEventListener("stream-subscribed", function (streamEvent) {
          var stream =
            streamEvent.data && streamEvent.data.stream
              ? streamEvent.data.stream
              : streamEvent.stream;
          for (k = 0; k < ATList.length; k++) {
            if (ATList[k].streamId == stream.getID()) {
              var remoteData = ATList[k];
              setLiveStream(stream, remoteData);
            }
          }
        });

        room.addEventListener("user-disconnected", function (event) {
          console.log(e);
          facexRunning = false;
        });

        // Listening to Incoming Data
        room.addEventListener("active-talker-data-in", function (data) {
          console.log("active-talker-data-in" + data);
          var obj = {
            msg: data.message.message,
            timestamp: data.message.timestamp,
            username: data.message.from,
          };
          // Handle UI to display message
        });

        // Stream went out of Room
        room.addEventListener("stream-removed", function (event) {
          console.log(event);
        });

        //Listening to face data
        room.addEventListener("user-data-received", function (event) {
          const data = event.message;
          const itemDiv = document.getElementById("title_" + data.senderId); //.innerHTML = evt.detail.output.attention.toFixed(2);
          if (itemDiv) {
            itemDiv.innerHTML =
              data.sender + " (attention=" + data.message.value.attention + ")";
          }
          //console.log(data, "faceTrackingData");
        });
      }
    });
  });
};

function audioMute() {
  var elem = document.getElementsByClassName("icon-confo-mute")[0];
  var onImgPath = "../img/mike.png",
    onImgName = "mike.png";
  var offImgPath = "../img/mute-mike.png",
    offImgName = "mute-mike.png";
  var currentImgPath = elem.src.split("/")[elem.src.split("/").length - 1];
  if (currentImgPath === offImgName) {
    localStream.unmuteAudio(function (arg) {
      elem.src = onImgPath;
      elem.title = "mute audio";
    });
  } else if (currentImgPath === onImgName) {
    localStream.muteAudio(function (arg) {
      elem.src = offImgPath;
      elem.title = "unmute audio";
    });
  }
}
function videoMute() {
  var elem = document.getElementsByClassName("icon-confo-video-mute")[0];
  var onImgPath = "../img/video.png",
    onImgName = "video.png";
  var offImgPath = "../img/mute-video.png",
    offImgName = "mute-video.png";
  var currentImgPath = elem.src.split("/")[elem.src.split("/").length - 1];
  if (currentImgPath === offImgName) {
    localStream.unmuteVideo(function (res) {
      var streamId = localStream.getID();
      var player = document.getElementById("stream" + streamId);
      player.srcObject = localStream.stream;
      player.play();
      elem.src = onImgPath;
      elem.title = "mute video";
    });
  } else if (currentImgPath === onImgName) {
    localStream.muteVideo(function (res) {
      elem.src = offImgPath;
      elem.title = "unmute video";
    });
  }
}

function endCall() {
  var r = confirm("Are you really want to Quit??");
  if (r == true) {
    window.location.href = SUPPORT_URL;
  }
}
function checkLiveness() {
  alert("Please move your face right slowely");
  isCheckLiveness = true;
  faceTrackingData.liveness = "";
}

function checkSimilarity() {}

function resetLiveness() {
  isCheckLiveness = false;
  faceTrackingData.liveness = "";
}
function appendFaceDetail() {
  isAppendFaceDetail = true;

  setInterval(function () {
    document.getElementById("face_attention").innerHTML = `
      <h4>Attention: ${faceTrackingData.attention}</h4>
      <h4>Age: ${faceTrackingData.age}</h4>
      <h4>Gender: ${faceTrackingData.gender}</h4>
      <h4>Pose: ${faceTrackingData.pose}</h4>
      <h4>Liveliness: ${faceTrackingData.liveness}</h4>
       <button type="button" onclick="checkLiveness()">Check liveliness</button>
       <button type="button" onclick="checkSimilarity()">Check Similarity</button>
       <span id="reset_liveness"><button type="button" onclick="resetLiveness()">Reset</button></span>
      `;
  }, 1000 / 3);
  $("#faces_snapshot").show();
  setInterval(function () {
    if (facesURL.length) {
      $("#face_image").empty();
      for (var i = 0; i < facesURL.length; i++) {
        var img = document.createElement("img");
        img.width = facesURL[i].width;
        img.height = facesURL[i].height;
        img.style.backgroundImage = "url(" + facesURL[i].url + ")";
        img.style.backgroundRepeat = "no-repeat";
        img.style.marginLeft = "5px";
        img.style.marginTop = "5px";
        img.style.border = "2px solid black";
        img.style.borderRadius = "10px";
        $("#face_image").append(img);
      }
    }
  }, 2000);
}

function imagedata_to_image(imagedata) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = imagedata.width;
  canvas.height = imagedata.height;
  ctx.putImageData(imagedata, 0, 0);
  var image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

function startFaceTrack() {
  faceX.startFaceDetector({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-detector", (evt) => {
        //// console.log(evt.detail, "facex detector event...........");
        const faces = evt.detail.faces;
        faceTrackingData.face = faces.length;
        if (facesURL.length === 5) {
          facesURL.splice(0, evt.detail.faces.length);
        }
        //facesURL = [];
        if (evt.detail.faces.length) {
          for (var i = 0; i < evt.detail.faces.length; i++) {
            const binarystring = imagedata_to_image(evt.detail.faces[i]);
            facesURL.push({
              url: binarystring.src,
              width: evt.detail.faces[i].width,
              height: evt.detail.faces[i].height,
            });
          }
        }
        //room.sendUserData(MessageOpt, true);
        if (!isAppendFaceDetail) {
          appendFaceDetail();
        }
      });
    }
  });
  faceX.startFacePose({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-pose", (evt) => {
        //console.log(evt.detail, "facex pose event...........");
        const pitch = evt.detail.output.pose.pitch.toFixed(2);
        const yaw = evt.detail.output.pose.yaw.toFixed(2);
        //const roll = evt.detail.output.pose.yaw.toFixed(2);

        if (yaw > 0.2 || yaw < -0.2 || pitch > 0.2 || pitch < -0.2)
          faceTrackingData.pose = "Please look into the camera";
        else faceTrackingData.pose = "Good";

        if (isCheckLiveness) {
          if (yaw < -0.1) {
            faceTrackingData.liveness = "You are Live";
            isCheckLiveness = false;
          } else {
            faceTrackingData.liveness = "Not Live";
          }
        }
      });
    }
  });
  faceX.startFaceAge({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-age", (evt) => {
        //console.log(evt.detail, "facex age event...........");
        const age = Math.ceil(evt.detail.output.numericAge / 5) * 5;
        faceTrackingData.age = age - 5 + "-" + age;
      });
    }
  });
  faceX.startFaceEmotion({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-emotion", (evt) => {
        //console.log(evt.detail, "facex emotion event...........");
      });
    }
  });
  faceX.startFaceGender({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-gender", (evt) => {
        //console.log(evt.detail, "facex gender event...........");
        faceTrackingData.gender = evt.detail.output.mostConfident;
      });
    }
  });
  faceX.startFaceFeatures({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-features", (evt) => {
        //console.log(evt.detail, "facex features event...........");
      });
    }
  });
  faceX.startFaceArousalValence({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-arousal-valence", (evt) => {
        //console.log(evt.detail, "facex arousal-valence event...........");
      });
    }
  });
  faceX.startFaceAttention({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-attention", (evt) => {
        //console.log(evt.detail, "facex attention event...........");
        const attention = evt.detail.output.attention.toFixed(2);
        if (attention < 0.2) faceTrackingData.attention = "Very Low";
        else if (attention > 0.2 && attention < 0.4)
          faceTrackingData.attention = "Low";
        else if (attention > 0.4 && attention < 0.6)
          faceTrackingData.attention = "Medium";
        else if (attention >= 0.6) faceTrackingData.attention = "High";
      });
    }
  });
}

// setTimeout(function () {
//   faceX.stopFacePose((evt) => {
////     console.log(evt, "stop face pose evt..............");
//   });
//   faceX.stopFaceAge((evt) => {
////     console.log(evt, "stop face age evt..............");
//   });
// }, 20000);
