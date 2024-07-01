from environs import Env
from pathlib import Path


env = Env(Path(__file__).parent / ".env")
env.read_env()  # read .env file, if it exists
# required variables

APP_NAME = env.str("APP_NAME")
ALLOWED_EXTENSIONS = env.list("ALLOWED_EXTENSIONS")
