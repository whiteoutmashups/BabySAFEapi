'Use strict';

var auth;
var Container = "apps/ronald";
var file = document.getElementById("file");
var filepath = document.getElementById("filepath");

//Finds and adds EventListener on buttons
window.document.getElementById("authorise").addEventListener("click", function() {
  authorise();
});

window.document.getElementById("istokenvalid").addEventListener("click", function() {
  istokenvalid();
});

window.document.getElementById("freetoken").addEventListener("click", function() {
  freetoken();
});

window.document.getElementById("uploadfile").addEventListener("click", function() {
  uploadfile();
});

//initialises and authorises with the network
function authorise() {
  var app = {
    name: "BabbySAFEapi",
    id: "ronald",
    version: "1.0",
    vendor: "ronald.apps",
  };

  var permissions = {
    '_public': [
      'Read',
      'Insert',
      'Update',
      'Delete',
      'ManagePermissions'
    ],
    '_publicNames': [
      'Read',
      'Insert',
      'Update',
      'Delete',
      'ManagePermissions'
    ]
  };

  var owncontainer = {
    own_container: true
  };

  // Initialise applications
  window.safeApp.initialise(app)
  .then((appToken) => {
    console.log("Initialise Token: " + appToken);
    // Ask for app authorization and permissions
    window.safeApp.authorise(appToken, permissions, owncontainer)
    .then((auth) => {
      console.log(auth);
      // Connect app to the network
      window.safeApp.connectAuthorised(appToken, auth)
      .then((authorisedAppToken) => {
        window.auth = authorisedAppToken;
        console.log('Authorised App Token: ' + authorisedAppToken);
         $('#authorise-status').html('Authorised');
        viewFiles();
      });
    });
  }, (err) => {
    $('#authorise-status').html('Not Authorised');
    console.error(err);
  });
}

//checks network and token status
function istokenvalid() {
  window.safeApp.isRegistered(auth)
  .then((registered) => {
    if (registered == true) {
       $('#authorise-status').html('Already Authorised');
    } else {
      $('#authorise-status').html('Not Authorised');
    }
  })

  window.safeApp.networkState(auth)
  .then((state) => console.log('Current network state: ', state));
}

//frees safe instance from memory
function freetoken() {
  window.safeApp.free(auth);
  $('#authorise-status').html('Not Authorised');
  console.log('Token freed');
  location.reload();
}

//upload files into network
function uploadfile() {
  var file = document.getElementById("file");
  var reader = new FileReader();
  var content = null;

  reader.readAsArrayBuffer(new Blob([file.files[0]]));

  reader.onload = function(event) {
    var arrayBuffer = reader.result;
    content = new Uint8Array(arrayBuffer);
    return content;
  };

  window.safeApp.getContainer(auth, Container)
  .then((mdHandle) => {
    window.safeMutableData.newMutation(auth)
    .then((mutationHandle) =>
      window.safeMutableDataMutation.insert(mutationHandle, file.files[0].name, content)
      .then(() =>
        window.safeMutableData.applyEntriesMutation(mdHandle, mutationHandle))
      .then(() => {
        console.log('New entry was inserted in the MutableData and committed to the network');
        $('#fileshow').empty();
        viewFiles();
      })
    );
  }, (err) => {
    console.error(err);
  });
}

function viewFiles() {
  var inc = 0;
  window.safeApp.getContainer(auth, Container)
  .then((mdHandle) => {

    window.safeMutableData.getEntries(mdHandle)
    .then((entriesHandle) => {
      window.safeMutableDataEntries.forEach(entriesHandle, (key, value) => {

        var htmlContent = "";

        switch((new TextDecoder("utf-8").decode(key)).split('.').pop())
        {
          //Text Format
          case "txt":
          case "html":
          case "htm":
          case "css":
          case "js":
          case "json":
          case "md":
          case "odt":
          case "rtf":
          case "csv":
            htmlContent = "<textarea id='tarControl'>" + (new TextDecoder("utf-8").decode(value.buf)) + "</textarea><p>";
          break;

          //Image Format
          case "jpg":
          case "jpeg":
          case "png":
          case "gif":
          case "tiff":
          case "tif":
          case "ico":
          case "webp":
          case "svg":
          case "bmp":
            htmlContent = "<img class='img-fluid img-thumbnail' id='imgControl' src='data:image/"  + (new TextDecoder("utf-8").decode(key)).split('.').pop() + ";base64," + arrayBufferToBase64(value.buf) + "'/>";
          break;

          //Audio Format
          case "mp3":
          case "oga":
          case "wav":
            htmlContent = "<audio controls src='data:audio/" + (new TextDecoder("utf-8").decode(key)).split('.').pop() + ";base64," +  arrayBufferToBase64(value.buf) + "' type='audio/" + (new TextDecoder("utf-8").decode(key)).split('.').pop() + "'></audio>";
          break;

          //Video Format
          case "mp4":
          case "ogv":
          case "ogg":
          case "webm":
            htmlContent = "<video class='video-js' controls> <source src='data:video/" + (new TextDecoder("utf-8").decode(key)).split('.').pop() + ";base64," +  arrayBufferToBase64(value.buf) + "' type='video/" + (new TextDecoder("utf-8").decode(key)).split('.').pop() + "'></video>";
          break;
        }
        inc++;

        var fileNo = '<div class="file-no">' + inc + '</div>';
        var fileContent = '<div class="file-content">' + htmlContent + '</div>';
        var fileName = '<div class="file-name">' + (new TextDecoder("utf-8").decode(key)) + '</div>';
        var fileThird = '<div class="file-name">' + (new TextDecoder("utf-8").decode(key)).split('.').pop() + '</div>';

        $('#fileshow').append('<div class="col-md-4">' + fileNo + fileContent + fileName + '</div>');
      });
    });
  },
  (err) => {
    console.err(err);
  });
}

function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var inc = 0; inc < len; inc++){
    binary += String.fromCharCode(bytes[inc]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64){
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for(var inc = 0; inc < len; inc++){
    bytes[inc] = binary_string.charCodeAt[inc];
  }
  return bytes.buffer;
}

function uintToString(uintArray) {
  return new TextDecoder("utf-8").decode(uintArray);
}

function getMessages() {
  window.safeCrypto.sha3Hash(auth, 'BabbySAFEapi')
    .then((hash) => window.safeMutableData.newPublic(auth, hash, 54321)
      .then((mdHandle) => window.safeMutableData.getEntries(mdHandle)
          .then((entriesHandle) => {
            messages.innerHTML = "";
            var date = new Date();
            var time = date.getTime();
            window.safeMutableDataEntries.forEach(entriesHandle, (key, value) => {

              if (uintToString(value.buf).length < 300 &&
                uintToString(value.buf) !== "" &&
                parseInt(uintToString(key)) < time &&
                parseInt(uintToString(key)).toString().length === 13 &&
                uintToString(key).length === 13) {
                console.log('Key: ', uintToString(key));
                console.log('Value: ', uintToString(value.buf));
                $("#messages").append('<li>' + uintToString(value.buf) + '</li>');
              }
              window.scrollTo(0, document.body.scrollHeight);
            });
            window.safeMutableDataEntries.free(entriesHandle);
            window.safeMutableData.free(mdHandle);
          }
      ))
    )
}

function sendMessage() {
  window.safeCrypto.sha3Hash(auth, 'BabbySAFEapi')
    .then((hash) => window.safeMutableData.newPublic(auth, hash, 54321))
    .then((mdHandle) => {
      var date = new Date();
      var time = date.getTime();
      window.safeMutableData.newMutation(auth).then(mutationHandle => {
        window.safeMutableDataMutation.insert(mutationHandle, time.toString(), textarea.value)
          .then(_ => window.safeMutableData.applyEntriesMutation(mdHandle, mutationHandle))
          .then(_ => {
            console.log('New entry was inserted in the MutableData and committed to the network');
            window.safeMutableDataMutation.free(mutationHandle);
            getMessages();
          });
        textarea.value = "";
      });
    });
}
