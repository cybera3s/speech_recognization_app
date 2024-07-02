from pathlib import Path
from flask import Flask
import ffmpeg
import speech_recognition as sr

# internal
from config.settings import ALLOWED_EXTENSIONS


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def create_upload_folder_if_not(app: Flask) -> Path | None:
    if not Path(app.config["UPLOAD_FOLDER"]).exists():
        upload_folder = Path(app.config["UPLOAD_FOLDER"])
        upload_folder.mkdir(exist_ok=True, parents=True)
        return upload_folder


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


class VoiceToTextError(Exception):
    pass


def turn_voice_to_text(language: str, wav_file_full_path: Path) -> str:
    """
    Returns text of provided wav file

    Raise VoiceToTextException if anything went wrong
    """

    # Recognizing Voice
    recognizer: sr.Recognizer = sr.Recognizer()
    audioFile: sr.AudioFile = sr.AudioFile(str(wav_file_full_path))

    with audioFile as source:
        recognizer.adjust_for_ambient_noise(source)
        data: sr.AudioData = recognizer.record(source)

    # recognizing voice using Google API
    try:
        transcript = recognizer.recognize_google(
            data, key=None, language=language
        )
        return transcript

    except sr.UnknownValueError as e:

        print(str(e))
        raise VoiceToTextError("مشکلی در تبدیل صوت بوجود امد")

    except sr.RequestError as e:
        print(str(e))
        raise VoiceToTextError("صوت دریافتی نامفهوم است")

    except Exception as e:
        print(str(e))
        raise VoiceToTextError("مشکلی پیش آمد، دوباره تلاش کنید")
