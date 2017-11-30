var auth;
var Container = "apps/ronald";
var file = document.getElementById("file");
var filepath = document.getElementById("filepath");

//Finds and adds EventListener on buttons
window.document.getElementById("authorise").addEventListener("click", function() {
  'use strict';
  authorise();
});

window.document.getElementById("istokenvalid").addEventListener("click", function() {
  'use strict';
  istokenvalid();
});

window.document.getElementById("freetoken").addEventListener("click", function() {
  'use strict';
  freetoken();
});

window.document.getElementById("uploadfile").addEventListener("click", function() {
  'use strict';
  uploadfile();
});

window.document.getElementById("showfile").addEventListener("click", function() {
  'use strict';
  viewFiles();
});

//initialises and authorises with the network
function authorise() {
  'use strict';

  var app = {
    name: "BabbySAFEapi",
    id: "ronald",
    version: "1.0",
    vendor: "ronald.apps",
  }

  var permissions = {
    '_public': [
      'Read',
      'Insert',
      'Delete',
      'ManagePermissions'
    ],
    '_publicNames': [
      'Read',
      'Insert',
      'Update'
    ]
  };

  var owncontainer = {
    own_container: true
  };

  // Initialise applications
  window.safeApp.initialise(app)
    .then(appToken => {
      window.safeApp.authorise(appToken, permissions, owncontainer)
        .then(auth => {
          // Connect app to the network
          window.safeApp.connectAuthorised(appToken, auth)
            .then(authorisedAppToken => {
              window.auth = authorisedAppToken;
              $('#authorise-status').html('Authorised');
            });
        })
    })
    .catch(err => {
      $('#authorise-status').html('Not Authorised');
      console.error('Error from webapp: ', err);
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
    });
}

//frees safe instance from memory
function freetoken() {
  window.safeApp.free(auth);
  auth = null;
  appToken = null;
  $('#authorise-status').html('Authorised Was Removed');
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
    .then((mdHandle) => window.safeMutableData.newMutation(auth)
        .then((mutationHandle) =>
          window.safeMutableDataMutation.insert(mutationHandle, file.files[0].name, content)
          .then(() =>
            window.safeMutableData.applyEntriesMutation(mdHandle, mutationHandle))
          .then(() => {
            console.log('New entry was inserted in the MutableData and committed to the network');
            $('#fileshow').empty();
            viewFiles();
          })
        )
    )
    .catch((err) => {
      console.error(err);
    });
}

function saveTextAsFile() {

  var textToSave = document.getElementById("inputTextToSave").value;
  var textReader = new FileReader();
  var fileNameToSaveAs = document.getElementById("inputFileNameToSaveAs").value;
  var textContent = null;

  textReader.readAsArrayBuffer(new Blob([textToSave], {type:"text/plain"}));

  textReader.onload = function(event) {
    var arrayBuffer = textReader.result;
    textContent = new Uint8Array(arrayBuffer);
    return textContent;
  };

  window.safeApp.getContainer(auth, Container)
    .then(mdHandle => window.safeMutableData.newMutation(auth)
      .then((mutationHandle) =>
        window.safeMutableDataMutation.insert(mutationHandle, fileNameToSaveAs, textContent)
          .then(_ => window.safeMutableData.applyEntriesMutation(mdHandle, mutationHandle))
          .then(_ => {
            console.log('Hore');
            $('#fileshow').empty();
            viewFiles();
            inputTextToSave.value = '';
            inputFileNameToSaveAs.value = '';
          })
      )
    )
    .then(_ => {

    })
    .catch((err) => {
      console.error(err);
    });
}

// upload text into network
function uploadtext() {
  var keytime = new Date().getTime().toString();
  window.safeApp.getContainer(auth, Container)
    .then(mdHandle => window.safeMutableData.newMutation(auth)
      .then((mutationHandle) =>
        window.safeMutableDataMutation.insert(mutationHandle, keytime, text.value)
          .then(_ => window.safeMutableData.applyEntriesMutation(mdHandle, mutationHandle))
          .then(_ => {
            console.log('New entry was inserted in the MutableData and committed to the network');
            $('#fileshow').empty();
            viewFiles();
          })
      )
    )
    .then(_ => {
      text.value = '';
    })
    .catch((err) => {
      console.error(err);
    });
}

function viewFiles() {
  var inc = 0;
  window.safeApp.getContainer(auth, Container)
    .then((mdHandle) => window.safeMutableData.getEntries(mdHandle)
      .then((entriesHandle) => window.safeMutableDataEntries.forEach(entriesHandle, (key, value) => {

          var htmlContent = "";

          switch((new TextDecoder("utf-8").decode(key)).split('.').pop())
          {
            //Text Format
            case "txt":
              htmlContent = "<textarea class='tarControl'>" + (uintToString(value.buf)) + "</textarea>";
              break;

            case "html":
            case "htm":
            case "css":
            case "js":
            case "json":
            case "md":
            case "odt":
            case "rtf":
            case "csv":
              htmlContent = "<textarea class='tarControl'>" + (new TextDecoder("utf-8").decode(value.buf)) + "</textarea>";
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
              htmlContent = "<img class='img-fluid img-thumbnail imgControl' src='data:image/"  + (new TextDecoder("utf-8").decode(key)).split('.').pop() + ";base64," + arrayBufferToBase64(value.buf) + "'/>";
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
          var fileAction = '<div class="file-action"><button id="delete-'+inc+'" class="btn btn-warning">x</button></div>';

          $('#fileshow').append('<div class="col-md-4">' + fileNo + fileContent + fileName + fileAction +'</div>');
        })
      )
    )
    .catch((err) => {
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
  textarea.value = '';
  document.getElementById('messages').innerHTML = '';
  window.safeApp.getContainer(auth, '_public')
    .then(mdHandle => {
      window.safeMutableData.getEntries(mdHandle)
        .then(entriesHandle => {
          window.safeMutableDataEntries.forEach(entriesHandle, (key, value) => {
            var el = document.getElementById('messages');
            var elChild = document.createElement('li');
            elChild.innerHTML = value.buf.toString();
            el.appendChild(elChild);
          });
          window.safeMutableDataEntries.free(entriesHandle);
          window.safeMutableData.free(mdHandle);
        }, err => {
          console.error(err);
        });
    });
}

function sendMessage() {
  var time = new Date().getTime().toString();
  window.safeApp.getContainer(auth, '_public')
    .then((mdHandle) => {
      window.safeMutableData.newMutation(auth)
        .then((mutationHandle) =>
          window.safeMutableDataMutation.insert(mutationHandle, time, textarea.value)
          .then(_ => window.safeMutableData.applyEntriesMutation(mdHandle, mutationHandle))
          .then(_ => {
            console.log('masuk: ', textarea.value, time);
            window.safeMutableDataMutation.free(mutationHandle);
            window.safeMutableData.free(mdHandle);
            getMessages();
          })
        );
      }
    )
    .catch((err) => {
      console.error(err);
    });
}

function delMessage() {
  window.safeApp.getContainer(auth, '_public')
    .then((mdHandle) => {
      window.safeMutableData.newMutation(auth)
        .then((mutationHandle) =>
          window.safeMutableDataMutation.remove(mutationHandle, 'key1', value.version + 1)
            .then(_ => {
              console.log('Registers a remove operation with mutation handle, later to be applied.');
              window.safeMutableData.applyEntriesMutation(mdHandle, mutationHandle);
            })
            .then(_ => {
              console.log('masuk: ', textarea.value, time);
              window.safeMutableDataMutation.free(mutationHandle);
              window.safeMutableData.free(mdHandle);
              getMessages();
            })
        )
      }
    )
    .catch((err) => {
      console.error(err);
    });
}
