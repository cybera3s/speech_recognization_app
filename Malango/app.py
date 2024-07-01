from pathlib import Path
from datetime import datetime
from flask import Flask, render_template, redirect, request
import speech_recognition as sr
import ffmpeg
from werkzeug.datastructures import FileStorage


# Uploading Configuration
UPLOAD_FOLDER = "./voices"
ALLOWED_EXTENSIONS: set[str] = {"wav", "mp3", "ogg"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 5 * 1000 * 1000  # 5 MB


def convert_to(input, output) -> bool:
    """
    Converts input file to provided output format

    Return:
        True if has no err else False
    """

    stream = ffmpeg.input(input)
    stream = ffmpeg.output(stream, output)
    out, err = ffmpeg.run(stream)

    if not err:
        return True
    return False


@app.route("/", methods=["POST"])
def voice_to_text_view():
    """Handle POST request to turn audio to text"""

    transcript: str = ""

    # Handle POST Request
    if "file" not in request.files:
        return redirect(request.url)

    # get data from request
    file: FileStorage = request.files["file"]
    lang: str | None = request.form.get("lang")
    # select language
    language: str = "fa" if lang == "1" else "en"  

    if file.filename == "":
        return redirect(request.url)

    if file:
        # Create mp3 and wav path
        filename: str = "voice_" + datetime.now().isoformat()

        # Create upload folder
        if not Path(app.config["UPLOAD_FOLDER"]).exists():
            upload_folder = Path(app.config["UPLOAD_FOLDER"])
            upload_folder.mkdir(exist_ok=True, parents=True)

        mp3_file_full_path: Path = Path(app.config["UPLOAD_FOLDER"]).joinpath(
            filename + ".mp3"
        )
        wav_file_full_path: Path = Path(app.config["UPLOAD_FOLDER"]).joinpath(
            filename + ".wav"
        )

        # Saving file
        file.save(mp3_file_full_path)

        if Path(mp3_file_full_path).is_file():

            # convert to wav file using ffmpeg tool
            convert_to(str(mp3_file_full_path), str(wav_file_full_path))

            # Recognizing Voice
            recognizer: sr.Recognizer = sr.Recognizer()
            audioFile: sr.AudioFile = sr.AudioFile(str(wav_file_full_path))

            with audioFile as source:
                recognizer.adjust_for_ambient_noise(source)
                data = recognizer.record(source)

            # recognizing voice using Google API
            error_message = None

            try:
                transcript = recognizer.recognize_google(
                    data, key=None, language=language
                )
            

            except sr.UnknownValueError as e:
                print(str(e))
                error_message: str = "مشکلی در تبدیل صوت بوجود امد"

            except sr.RequestError as e:
                print(str(e))
                error_message: str = "صوت دریافتی نامفهوم است"

            except Exception as e:
                print(str(e))
                error_message = "مشکلی پیش آمد، دوباره تلاش کنید"

            # removing audio files
            mp3_file_full_path.unlink()
            wav_file_full_path.unlink()

            if error_message:
                return {"message": error_message}, 400

            return {"data": transcript}


@app.route("/", methods=["GET"])
def index():
    context = {
        "app_title": "ملنگو",
    }
    return render_template("index.html", **context)


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
