const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const soundClips = document.querySelector(".sound-clips");
const text = document.getElementById("text");
const transcribedTextElement = document.getElementById("transcribedText");
const sendBtn = document.getElementById("send");
const lang = document.getElementById("lang");
const recordState = document.getElementById("recordState");
const INDEX_URL = "http://127.0.0.1:5000";
const shareVoiceFileId = "share_voice_file";
const copyToClipboardElement = document.getElementById("copyToClipboard");
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
        transcribedTextElement.innerHTML = "فایل صوتی در دسترس نیست!";
        return;
      }

      event.target.innerHTML = "ارسال شد!";
      event.target.classList = "btn btn-success w-100 mt-4";

      transcribedTextElement.innerHTML = "در حال شناسایی صوت...";
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
          transcribedTextElement.innerHTML = data.data;

          // restart copy to clipboard elem
          copyToClipboardElement.classList = "bi bi-copy"

        })
        .catch((err) => {
          console.log(err);
          transcribedTextElement.innerHTML = err.message;
          // restart copy to clipboard elem
          copyToClipboardElement.classList = "bi bi-copy"

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
  recordState.innerHTML = "در حال صبط...";
}

/**
 * Stop recording
 */
function stopRecording(event) {
  this.mr.stop();
  console.log(this.mr.state);
  recordBtn.style.background = "";
  recordBtn.style.color = "";
  recordState.innerHTML = "توقف!";
}

function RestartSendBtn() {
  sendBtn.innerHTML = "ارسال صوت";
  sendBtn.classList = "btn btn-primary w-100 mt-4";
}


const VoiceFileInput = document.getElementById(shareVoiceFileId);

VoiceFileInput.addEventListener("click", (e) => {
  console.log("Shared");
  console.log(VoiceFileInput.files);

  const clipContainer = document.createElement("article");
  const audio = document.createElement("audio");
})


async function uploadFile() {
  let formData = new FormData();
  const language = document.getElementById("lang");

  formData.append("file", VoiceFileInput.files[0]);
  formData.append("lang", language.value);

  await fetch(INDEX_URL, {
    method: "POST",
    body: formData
  })
    .then((response) => {
      console.log(response);
      RestartSendBtn();

      if (response.status === 400) {
        throw new Error("خطایی رخ داده لطفا دوباره تلاش کنید");
      }

      return response.json();
    })
    .then((data) => {
      console.log(data);
      transcribedTextElement.innerHTML = data.data;

      // restart copy to clipboard elem
      copyToClipboardElement.classList = "bi bi-copy"

    })
    .catch((err) => {
      console.log(err);
      transcribedTextElement.innerHTML = err.message;

      // restart copy to clipboard elem
      copyToClipboardElement.classList = "bi bi-copy"

      RestartSendBtn();
    });
  alert('The file has been uploaded successfully.');
}



function copyToClipboard(elem) {
  // Get the text field
  var copyText = document.getElementById("transcribedText");

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText.innerText);


  elem.classList = "bi bi-check-all"

  setTimeout(() => {
    elem.classList = "bi bi-copy";
  }, 5000);

}