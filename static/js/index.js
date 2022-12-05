const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const soundClips = document.querySelector(".sound-clips");
const text = document.getElementById("text");
const sendBtn = document.getElementById("send");
const lang = document.getElementById("lang");
const recordState = document.getElementById("recordState");
const INDEX_URL = "http://127.0.0.1:5000";

/**
 * Check if browser supports getUserMedia
 * @returns true or false
 */
const checkBrowserSupport = () => {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    const msg = "getUserMedia not supported on your browser!";
    console.log(msg);
    return Promise.reject(msg);
  } else {
    console.log("getUserMedia supported.");
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
};

checkBrowserSupport()
  .then((stream) => {
    // Initializing
    let options = {
      audioBitsPerSecond: 32000,
      mimeType: "audio/webm;codec=pcm",
    };
    const mediaRecorder = new MediaRecorder(stream, options);

    // Start Recording
    recordBtn.addEventListener("click", startRecording);
    recordBtn.mr = mediaRecorder;

    // Save data in a list
    let chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    // Stop recording
    stopBtn.addEventListener("click", stopRecording);
    stopBtn.mr = mediaRecorder;

    let blob;

    // stop recording event
    mediaRecorder.onstop = (e) => {
      console.log("Recording Stopped!");

      const clipContainer = document.createElement("article");
      const audio = document.createElement("audio");

      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      audio.classList = "w-100";

      // remove last audio files
      if (soundClips.childElementCount !== 0) {
        soundClips.innerHTML = "";
      }

      clipContainer.appendChild(audio);
      soundClips.appendChild(clipContainer);

      blob = new Blob(chunks, { type: "audio/wav; codecs=pcm" });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
    };

    ///////////////////////////// Click Send Button event /////////////////////////////
    sendBtn.addEventListener("click", (event) => {
      // There is no audio file yet
      if (!blob) {
        text.innerHTML = "No audio Provided!";
        return;
      }

      event.target.innerHTML = "Sent!";
      event.target.classList = "btn btn-success w-100 mt-4";

      text.innerHTML = "Recognizing Voice...";
      var data = new FormData();
      data.append("file", blob);
      data.append("lang", lang.value);

      ///////////////////////////// Sending POST request /////////////////////////////
      fetch(INDEX_URL, {
        method: "POST",
        body: data,
      })
        .then((response) => {
          console.log(response);
          RestartSendBtn();

          if (response.status === 400) {
            throw new Error("Something went wrong, try again!");
          }

          return response.json();
        })
        .then((data) => {
          console.log(data);
          text.innerHTML = data.data;
        })
        .catch((err) => {
          console.log(err);
          text.innerHTML = err.message;
          RestartSendBtn();
        });
    });
  })
  // Error callback
  .catch((err) => {
    console.error(`The following getUserMedia error occurred: ${err}`);
  });

/**
 * Start Recording
 */
function startRecording(event) {
  this.mr.start();
  console.log("Recording started");
  this.style.background = "red";
  this.style.padding = "5px";
  this.style.borderRadius = "5px";
  this.style.color = "black";
  recordState.innerHTML = "Recording...";
}

/**
 * Stop recording
 */
function stopRecording(event) {
  this.mr.stop();
  console.log(this.mr.state);
  recordBtn.style.background = "";
  recordBtn.style.color = "";
  recordState.innerHTML = "Stoped!";
}

function RestartSendBtn() {
  sendBtn.innerHTML = "Send Voice";
  sendBtn.classList = "btn btn-primary w-100 mt-4";
}
