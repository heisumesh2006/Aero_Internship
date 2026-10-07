import shutil
import stat
from pathlib import Path, PurePosixPath, PureWindowsPath
from zipfile import BadZipFile, ZipFile, ZipInfo

from app.core.exceptions import AppError

MAX_MEMBERS = 200
MAX_EXPANDED_BYTES = 150 * 1024 * 1024
MAX_COMPRESSION_RATIO = 1000
WINDOWS_DEVICES = {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}


def _safe_destination(root: Path, info: ZipInfo) -> Path:
    name = info.filename
    posix = PurePosixPath(name)
    windows = PureWindowsPath(name)
    reserved = any(part.rstrip(" .").split(".")[0].rstrip(" ").upper() in WINDOWS_DEVICES for part in posix.parts)
    if (
        not name
        or "\\" in name
        or reserved
        or posix.is_absolute()
        or windows.is_absolute()
        or windows.drive
        or ".." in posix.parts
        or name.startswith("/")
    ):
        raise AppError("UNSAFE_ARCHIVE", "Archive contains an unsafe path.")
    mode = info.external_attr >> 16
    if stat.S_IFMT(mode) == stat.S_IFLNK:
        raise AppError("UNSAFE_ARCHIVE", "Archive contains a symbolic link.")
    target = (root / name).resolve()
    if not target.is_relative_to(root.resolve()):
        raise AppError("UNSAFE_ARCHIVE", "Archive member escapes the extraction directory.")
    return target


