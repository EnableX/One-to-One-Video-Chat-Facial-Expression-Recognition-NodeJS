let faceCY = null;
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
function checkLiveness() {
  alert("Please move your face right slowely");
  isCheckLiveness = true;
  faceTrackingData.liveness = "";
}
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

window.onload = function () {
  const faceX = new EnxFaceX();
  console.log(faceX, "ai.......");
  faceX.initFaceX({});
  // let stopSDK, terminateSDK;
  // ////////////////////////////////face tracking ////////////////
  // var video = document.querySelector("#videoElement");
  // if (navigator.mediaDevices.getUserMedia) {
  //   navigator.mediaDevices
  //     .getUserMedia({ video: true })
  //     .then(function (stream) {
  //       video.srcObject = stream;
  //     })
  //     .catch(function (err0r) {
  //       console.log("Something went wrong!");
  //     });
  // }
  // $("#faces_snapshot").hide();
  // function imagedata_to_image(imagedata) {
  //   var canvas = document.createElement("canvas");
  //   var ctx = canvas.getContext("2d");
  //   canvas.width = imagedata.width;
  //   canvas.height = imagedata.height;
  //   ctx.putImageData(imagedata, 0, 0);
  //   var image = new Image();
  //   image.src = canvas.toDataURL();
  //   return image;
  // }
  // faceCY = CY.loader().licenseKey(
  //   "1324f0ae17d0aade6ac91aa5d18390c2abfb0028cb05"
  // );
  // faceCY
  //   .addModule(CY.modules().FACE_DETECTOR.name, { resetTrackerAfter: 1 })
  //   .addModule(CY.modules().FACE_ATTENTION.name, faceConfig)
  //   .addModule(CY.modules().FACE_AGE.name, {})
  //   .addModule(CY.modules().FACE_GENDER.name, faceConfig)
  //   .addModule(CY.modules().FACE_POSE.name, faceConfig)
  //   .addModule(CY.modules().FACE_EMOTION.name, faceConfig)
  //   .load()
  //   .then(({ start, stop, terminate }) => {
  //     stopSDK = stop;
  //     terminateSDK = terminate;
  //     start();
  //     setTimeout(stopSDK, 10000);
  //   });
  // window.addEventListener(CY.modules().FACE_ATTENTION.eventName, (evt) => {
  //   console.log(evt, "face attention");
  //   const attention = evt.detail.output.attention.toFixed(2);
  //   if (attention < 0.2) faceTrackingData.attention = "Very Low";
  //   else if (attention > 0.2 && attention < 0.4)
  //     faceTrackingData.attention = "Low";
  //   else if (attention > 0.4 && attention < 0.6)
  //     faceTrackingData.attention = "Medium";
  //   else if (attention >= 0.6) faceTrackingData.attention = "High";

  //   const MessageOpt = {
  //     action: "face_tracking",
  //     value: faceTrackingData,
  //   };
  // });
  // window.addEventListener(CY.modules().FACE_AGE.eventName, (evt) => {
  //   const age = Math.ceil(evt.detail.output.numericAge / 5) * 5;
  //   faceTrackingData.age = age - 5 + "-" + age;
  //   const MessageOpt = {
  //     action: "face_tracking",
  //     value: faceTrackingData,
  //   };
  // });
  // window.addEventListener(CY.modules().FACE_GENDER.eventName, (evt) => {
  //   faceTrackingData.gender = evt.detail.output.mostConfident;
  //   const MessageOpt = {
  //     action: "face_tracking",
  //     value: faceTrackingData,
  //   };
  // });
  // window.addEventListener(CY.modules().FACE_POSE.eventName, (evt) => {
  //   const pitch = evt.detail.output.pose.pitch.toFixed(2);
  //   const yaw = evt.detail.output.pose.yaw.toFixed(2);
  //   //const roll = evt.detail.output.pose.yaw.toFixed(2);

  //   if (yaw > 0.2 || yaw < -0.2 || pitch > 0.2 || pitch < -0.2)
  //     faceTrackingData.pose = "Please look into the camera";
  //   else faceTrackingData.pose = "Good";

  //   if (isCheckLiveness) {
  //     if (yaw < -0.1) {
  //       faceTrackingData.liveness = "You are Live";
  //       isCheckLiveness = false;
  //     } else {
  //       faceTrackingData.liveness = "Not Live";
  //     }
  //   }
  // });

  // window.addEventListener(CY.modules().FACE_DETECTOR.eventName, (evt) => {
  //   const faces = evt.detail.faces;
  //   faceTrackingData.face = faces.length;

  //   if (facesURL.length === 5) {
  //     facesURL.splice(0, evt.detail.faces.length);
  //   }
  //   //facesURL = [];
  //   if (evt.detail.faces.length) {
  //     for (var i = 0; i < evt.detail.faces.length; i++) {
  //       const binarystring = imagedata_to_image(evt.detail.faces[i]);
  //       facesURL.push({
  //         url: binarystring.src,
  //         width: evt.detail.faces[i].width,
  //         height: evt.detail.faces[i].height,
  //       });
  //     }
  //   }
  //   //room.sendUserData(MessageOpt, true);
  //   if (!isAppendFaceDetail) {
  //     appendFaceDetail();
  //   }
  // });
  // window.addEventListener(CY.modules().FACE_EMOTION.eventName, (evt) => {
  //   const liveness = evt.detail.output.dominantEmotion;
  //   if(liveness !== undefined){
  //     trackLiveness[liveness] =   trackLiveness[liveness]+1;
  //     faceTrackingData.liveness = liveness;
  //     document.getElementById(
  //       "liveness"
  //     ).innerHTML = JSON.stringify(trackLiveness);
  //   }
  // });

  ///////////////////////////////end face tracking/////////////
};
