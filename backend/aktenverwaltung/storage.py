import os
import stat
from pathlib import Path

from django.conf import settings


def ensure_docs_root() -> Path:
    root = Path(settings.MEDIA_ROOT)
    if not root.exists():
        root.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(root, 0o775)
        except Exception:
            pass # Ignore on Windows if it fails or if not applicable
    return root


def get_akte_directory(aktenzeichen: str) -> Path:
    safe_name = aktenzeichen.replace("/", "_")
    directory = ensure_docs_root() / safe_name
    if not directory.exists():
        directory.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(directory, 0o775)
        except Exception:
            pass
    return directory


def store_document(akte, upload) -> str:
    directory = get_akte_directory(akte.aktenzeichen)
    filename = Path(upload.name).name
    target = directory / filename

    with target.open("wb+") as destination:
        for chunk in upload.chunks():
            destination.write(chunk)

    try:
        os.chmod(target, 0o664)
    except Exception:
        pass

    relative_path = f"{akte.aktenzeichen}/{filename}"
    return relative_path

