from pathlib import Path
import os
from datetime import datetime
from flask import Flask, render_template, redirect, request
import speech_recognition as sr
import http


# Uploading Configuration
UPLOAD_FOLDER = "./voices"
ALLOWED_EXTENSIONS = {"wav"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 5 * 1000 * 1000  # 5 MB


@app.route("/", methods=["GET", "POST"])
def index():
    """Index Page View"""

    transcript = ""

    if request.method == "POST":
        if "file" not in request.files:
            return redirect(request.url)

        # get data from request
        file = request.files["file"]
        lang = request.form.get("lang")
        language = "en" if lang == "1" else "fa"  # select language

        if file.filename == "":
            return redirect(request.url)

        if file:
            # Create mp3 and wav path
            filename = "voice_" + datetime.now().isoformat()
            mp3_file_full_path = Path(app.config["UPLOAD_FOLDER"]).joinpath(
                filename + ".mp3"
            )
            wav_file_full_path = Path(app.config["UPLOAD_FOLDER"]).joinpath(
                filename + ".wav"
            )

            file.save(mp3_file_full_path)

            if Path(mp3_file_full_path).is_file():

                # convert to wav file using ffmpeg tool
                commandwav = f"ffmpeg -i {mp3_file_full_path} {wav_file_full_path}"
                os.system(commandwav)  # run command

                # Recognizing Voice
                recognizer = sr.Recognizer()
                audioFile = sr.AudioFile(str(wav_file_full_path))

                with audioFile as source:
                    data = recognizer.record(source)

                # recognizing voice using Google API
                error_message = None

                try:
                    transcript = recognizer.recognize_google(
                        data, key=None, language=language
                    )
                except Exception as e:
                    error_message = "Something Went wrong! Try Again"

                # removing audio files
                mp3_file_full_path.unlink()
                wav_file_full_path.unlink()

                if error_message:
                    return {"message": error_message}, 400

                return {"data": transcript}

    # Handle Get Request
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
