from pathlib import Path
from datetime import datetime
from flask import (
    Flask,
    render_template,
    redirect,
    request,
    jsonify,
    send_file,
    Response,
)
from werkzeug.datastructures import FileStorage

# internal
from utils.hleper import (
    allowed_file,
    create_upload_folder_if_not,
    convert_to,
    turn_voice_to_text,
    VoiceToTextError,
)


# Uploading Configuration
UPLOAD_FOLDER = "./voices"


app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 5 * 1000 * 1000  # 5 MB


# Create upload folder
create_upload_folder_if_not(app)


@app.route("/", methods=["POST"])
def voice_to_text_view():
    """Handle POST request to turn audio to text"""

    transcript: str = ""

    if "file" not in request.files:
        return redirect(request.url)

    # get data from request
    file: FileStorage = request.files["file"]
    lang: str | None = request.form.get("lang")
    # select language
    language: str = "fa" if lang == "1" else "en"

    if file.filename == "":
        return redirect(request.url)

    if file.filename != "blob" and not allowed_file(file.filename):
        return jsonify(message="فرمت فایل نامعتبر است"), 400

    if file:
        # Create mp3 and wav path
        filename: str = "voice_" + datetime.now().isoformat()

        mp3_file_full_path: Path = Path(app.config["UPLOAD_FOLDER"]).joinpath(
            filename + ".mp3"
        )
        wav_file_full_path: Path = Path(app.config["UPLOAD_FOLDER"]).joinpath(
            filename + ".wav"
        )

        # Saving file
        file.save(mp3_file_full_path)

        # convert to wav file using ffmpeg tool
        convert_to(str(mp3_file_full_path), str(wav_file_full_path))
        error_message: str = ""

        # Recognizing Voice
        try:
            transcript = turn_voice_to_text(language, wav_file_full_path)
        except VoiceToTextError as e:
            error_message = str(e)

        # removing audio files
        mp3_file_full_path.unlink()
        wav_file_full_path.unlink()

        if error_message:
            return {"message": error_message}, 400
        else:
            if len(transcript) > 100:

                def generate():
                    for data in transcript:
                        yield data

                return generate(), {"Content-Type": "text/plain"}

            return {"data": transcript}, 200


@app.route("/", methods=["GET"])
def index():
    context: dict[str, str] = {
        "app_title": "ملنگو",
    }
    return render_template("index.html", **context)


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
