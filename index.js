let preview = document.getElementById("preview");
let recording = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let takepictureButton = document.getElementById("takepictureButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");
let canvas = document.getElementById('canvas');
let frames = document.getElementById('frames');
var width = 320;    // We will scale the photo width to this
var height = 300;

let setupFrameInterval = setInterval(generateFrame, 1000);

function generateFrame() {
    var elem = document.createElement("img");
    elem.src = takepicture();
    frames.appendChild(elem);
}

let recordingTimeMS = 15000;
function log(msg) {
    logElement.innerHTML += msg + "\n";
}
function wait(delayInMS) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
}
function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];
    // setupFrameInterval;
    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();
    log(recorder.state + " for " + (lengthInMS / 1000) + " seconds...");

    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = event => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(
        () => recorder.state == "recording" && recorder.stop()
    );

    return Promise.all([
        stopped,
        recorded
    ])
        .then(() => data);
}
function stop(stream) {
    stream.getTracks().forEach(track => track.stop());
    clearInterval(setupFrameInterval);
}
startButton.addEventListener("click", function () {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(stream => {
        preview.srcObject = stream;
        downloadButton.href = stream;
        preview.captureStream = preview.captureStream || preview.mozCaptureStream;
        return new Promise(resolve => preview.onplaying = resolve);
    }).then(() => startRecording(preview.captureStream(), recordingTimeMS))
        .then(recordedChunks => {
            let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
            recording.src = URL.createObjectURL(recordedBlob);
            downloadButton.href = recording.src;
            downloadButton.download = "RecordedVideo.webm";

            log("Successfully recorded " + recordedBlob.size + " bytes of " +
                recordedBlob.type + " media.");
        })
        .catch(log);
}, false); stopButton.addEventListener("click", function () {
    stop(preview.srcObject);
}, false);

// preview.addEventListener('canplay', function (ev) {
//     console.log('canplay');
//     if (!streaming) {
//         height = video.videoHeight / (video.videoWidth / width);

//         // Firefox currently has a bug where the height can't be read from
//         // the video, so we will make assumptions if this happens.

//         if (isNaN(height)) {
//             height = width / (4 / 3);
//         }

//         preview.setAttribute('width', width);
//         preview.setAttribute('height', height);
//         canvas.setAttribute('width', width);
//         canvas.setAttribute('height', height);
//         streaming = true;
//     }
// }, false);

function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
}

function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(preview, 0, 0, width, height);

        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
        return data;
    } else {
        clearphoto();
    }
}
