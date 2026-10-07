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


def extract_single_shapefile(archive: Path, destination: Path) -> Path:
    """Validate the entire archive before writing any member to disk."""
    try:
        with ZipFile(archive) as zipped:
            members = zipped.infolist()
            if len(members) > MAX_MEMBERS:
                raise AppError("INVALID_SHAPEFILE_ARCHIVE", "Archive contains too many entries.")
            files: dict[str, tuple[ZipInfo, Path]] = {}
            total = 0
            for member in members:
                target = _safe_destination(destination, member)
                if member.flag_bits & 1:
                    raise AppError("INVALID_SHAPEFILE_ARCHIVE", "Encrypted archives are not supported.")
                if member.is_dir():
                    continue
                total += member.file_size
                if total > MAX_EXPANDED_BYTES or (
                    member.file_size > 0 and member.file_size > max(member.compress_size, 1) * MAX_COMPRESSION_RATIO
                ):
                    raise AppError("INVALID_SHAPEFILE_ARCHIVE", "Archive exceeds extraction limits.")
                key = str(target).casefold()
                if key in files:
                    raise AppError("INVALID_SHAPEFILE_ARCHIVE", "Archive contains duplicate paths.")
                files[key] = member, target

            shapefiles = [target for _, target in files.values() if target.suffix.lower() == ".shp"]
            if len(shapefiles) != 1:
                raise AppError("INVALID_SHAPEFILE_ARCHIVE", "Archive must contain exactly one .shp file.")
            shp = shapefiles[0]
            siblings = {(target.parent, target.stem.casefold(), target.suffix.lower()) for _, target in files.values()}
            for extension in (".shx", ".dbf"):
                if (shp.parent, shp.stem.casefold(), extension) not in siblings:
                    raise AppError("INVALID_SHAPEFILE_ARCHIVE", f"Shapefile is missing {extension} companion file.")

            for member, target in files.values():
                target.parent.mkdir(parents=True, exist_ok=True)
                with zipped.open(member) as source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)
            return shp
    except BadZipFile as exc:
        raise AppError("INVALID_SHAPEFILE_ARCHIVE", "ZIP archive is corrupt or invalid.") from exc
