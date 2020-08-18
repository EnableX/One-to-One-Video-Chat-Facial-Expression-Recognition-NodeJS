///////////////////////////////////////////////////////
//
// File: index.js
// This is applicaiton file for login page to accept login credentials
//
// Last Updated: 29-11-2018
// Reformat, Indentation, Inline Comments
//
/////////////////////////////////////////////////////
function listOutCam(camLst) {
  for (var i = 0; i < camLst.length; i++) {
    var x = document.getElementById("cam");
    var option = document.createElement("option");
    option.text = camLst[i].label;
    var camoptId = camLst[i].deviceId;
    option.setAttribute("id", camoptId);
    x.add(option);
  }
}
window.onload = function () {
  $(".login_join_div").show();
  EnxRtc.getDevices(function (arg) {
    if (arg.result === 0) {
      var camLst = arg.devices.cam;
      listOutCam(camLst);

      localStorage.setItem(
        "cam",
        $(document).find("#cam").find("option:eq(0)").attr("id")
      );
    } else if (arg.result === 1153) {
      $("#unsupported_browser_message").show();
    } else {
      $("#media-device-permission-error").show();
    }
  });
};
$(document).on("change", "#cam", function () {
  localStorage.setItem("cam", $(this).find("option:selected").attr("id"));
  setCookie("vcxCamId", $(this).find("option:selected").val());
});
var username = "demo";
var password = "enablex";

// Verifies login credentials before moving to Conference page

document
  .getElementById("login_form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    var name = document.querySelector("#nameText"),
      room = document.querySelector("#roomName"),
      agree = document.querySelector('[name="agree"]'),
      errors = [];
    if (name.value.trim() === "") {
      errors.push("Enter your name.");
    }
    if (room.value.trim() === "") {
      errors.push("Enter your Room Id.");
    }

    if (!agree.checked) {
      errors.push("Accept terms of use and privacy policy.");
    }

    if (errors.length > 0) {
      var mappederrors = errors.map(function (item) {
        return item + "</br>";
      });
      var allerrors = mappederrors.join("").toString();
      $.toast({
        heading: "Error",
        text: allerrors,
        showHideTransition: "fade",
        icon: "error",
        position: "top-right",
        showHideTransition: "slide",
      });

      return false;
    }

    joinRoom(document.getElementById("roomName").value, function (data) {
      if (!jQuery.isEmptyObject(data)) {
        var user_ref = document.getElementById("nameText").value;
        var usertype = undefined;
        if (document.getElementById("moderator").checked) {
          usertype = document.getElementById("moderator").value;
        }
        if (document.getElementById("participant").checked) {
          usertype = document.getElementById("participant").value;
        }

        window.location.href =
          "confo.html?roomId=" +
          data.room_id +
          "&usertype=" +
          usertype +
          "&user_ref=" +
          user_ref;
      } else {
        alert("No room found");
      }
    });
  });

var loadingElem = document.querySelector(".loading");
document
  .getElementById("create_room")
  .addEventListener("click", function (event) {
    loadingElem.classList.add("yes");
    createRoom(function (result) {
      document.getElementById("roomName").value = result;
      document.getElementById("create_room_div").style.display = "none";
      document.getElementById("message").innerHTML =
        "We have prefilled the form with room-id. Share it with someone you want to talk to";
    });
  });

var createRoom = function (callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var response = JSON.parse(this.responseText);
      if (response.error) {
        $.toast({
          heading: "Error",
          text: response.error,
          showHideTransition: "fade",
          icon: "error",
          position: "top-right",
        });
      } else {
        callback(response.room.room_id);
        loadingElem.classList.remove("yes");
      }
    }
  };
  xhttp.open("POST", "/createRoom/", true);
  xhttp.setRequestHeader("Content-Type", "application/json");
  xhttp.setRequestHeader(
    "Authorization",
    "Basic " + btoa(username + ":" + password)
  );
  xhttp.send();
};
