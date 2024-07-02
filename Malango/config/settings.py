from environs import Env
from pathlib import Path


env = Env()
env.read_env(
    path=(Path(__file__).parent / ".env").resolve()
)  # read .env file, if it exists
# required variables

APP_NAME = env.str("APP_NAME")
ALLOWED_EXTENSIONS = env.list("ALLOWED_EXTENSIONS")
