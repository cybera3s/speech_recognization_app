const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const soundClips = document.querySelector(".sound-clips");
const text = document.getElementById("text");
const transcribedTextElement = document.getElementById("transcribedText");
const sendBtn = document.getElementById("send");
const lang = document.getElementById("lang");
const recordState = document.getElementById("recordState");
const INDEX_URL = "/";
const shareVoiceFileId = "share_voice_file";
const copyToClipboardElement = document.getElementById("copyToClipboard");


function getLocalStream() {
  navigator.mediaDevices
    .getUserMedia({ video: false, audio: true })
    .then((stream) => {
      window.localStream = stream; // A
      window.localAudio.srcObject = stream; // B
      window.localAudio.autoplay = true; // C
    })
    .catch((err) => {
      console.error(`you got an error: ${err}`);
    });
}

// 

if (window.location.protocol.startsWith("http")) {
  console.log("MEdiaDevices permissions available only in secure contexts (HTTPS)");
} else {
  getLocalStream();
}

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
    recordBtn.addEventListener("mousedown", startRecording);
    recordBtn.mr = mediaRecorder;

    // Save data in a list
    let chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    // Stop recording
    recordBtn.addEventListener("mouseup", stopRecording);
    recordBtn.mr = mediaRecorder;

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

      if ($(sendBtn).hasClass("d-none")) {
        $(sendBtn).removeClass("d-none");
      }

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

      transcribedTextElement.innerHTML = "در حال شناسایی متن صوت...";
      var data = new FormData();
      data.append("file", blob);
      data.append("lang", lang.value);

      ///////////////////////////// Sending POST request /////////////////////////////
      var err_message = "";
      let mode = "";

      fetch(INDEX_URL, {
        method: "POST",
        body: data,
      })
        .then((response) => {

          RestartSendBtn();

          if (response.status === 400) {
            return response.json().then(data => {
              err_message = data.message;
              throw new Error(err_message);
            })

          }

          if (response.headers.get("Content-Type") === "text/plain") {
            mode = "file";
            response.blob().then(blob => {
              download(blob, "transcribed_file.txt");
              return;
            })
          } else {
            return response.json();
          }

        })
        .then((data) => {

          if (mode === "file") {
            transcribedTextElement.innerHTML = "صوت شما تبدیل به فایل شد";
            $("#copyToClipboard").addClass("d-none");

          } else {
            transcribedTextElement.innerHTML = data.data;

            // restart copy to clipboard elem
            $("#copyToClipboard").removeClass("d-none");
          }

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
  recordState.innerHTML = "در حال ضبط...";
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

  const clipContainer = document.createElement("article");
  const audio = document.createElement("audio");
})


const shareVoiceFileButton = document.getElementById("sendVoiceFile");
shareVoiceFileButton.addEventListener("click", uploadFile);


async function uploadFile(sendButton) {
  transcribedTextElement.innerHTML = "لطفا برای آپلود فایل صبر کنید...";

  let formData = new FormData();
  const language = document.getElementById("lang");
  const VoiceFileInput = document.getElementById(shareVoiceFileId);

  formData.append("file", VoiceFileInput.files[0]);
  formData.append("lang", language.value);
  let mode = "";

  await fetch(INDEX_URL, {
    method: "POST",
    body: formData
  })
    .then((response) => {
      console.log(response)

      RestartSendBtn();

      if (response.status === 400) {
        return response.json().then(data => {
          throw new Error(data.message);
        })

      }

      if (response.headers.get("Content-Type") === "text/plain") {
        mode = "file";
        response.blob().then(blob => {
          download(blob, "transcribed_file.txt");
          return;
        })
      } else {
        return response.json();
      }


    })
    .then((data) => {
      console.log(data);

      if (mode === "file") {
        transcribedTextElement.innerHTML = "صوت شما تبدیل به فایل شد";
        // hide copy to clipboard button
        $("#copyToClipboard").addClass("d-none");

      } else {
        transcribedTextElement.innerHTML = data.data;

        // show copy to clipboard button
        $("#copyToClipboard").removeClass("d-none");
      }


    })
    .catch((err) => {
      console.log(err);
      transcribedTextElement.innerHTML = err.message;

      // restart copy to clipboard elem
      copyToClipboardElement.classList = "bi bi-copy"

      RestartSendBtn();
    });


  restartShareVoiceFileButtonStyle(shareVoiceFileButton)

}

function restartShareVoiceFileButtonStyle(shareVoiceFileButton) {
  oldClassList = "btn btn-primary w-100 mt-4";
  oldText = shareVoiceFileButton.innerText;

  shareVoiceFileButton.classList = "btn btn-success w-100 mt-4";
  shareVoiceFileButton.innerText = "با موفقیت اپلود شد";

  setTimeout(() => {
    shareVoiceFileButton.classList = oldClassList;
    shareVoiceFileButton.innerText = oldText;
  }, 2000);

}

$("#copyToClipboard").on("click", copyToClipboard);

function copyToClipboard(event) {
  let element = event.target;

  // Get the text field
  var copyText = document.getElementById("transcribedText");

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText.innerText);


  element.classList = "bi bi-check-all"

  setTimeout(() => {
    element.classList = "bi bi-copy";
  }, 2000);

}