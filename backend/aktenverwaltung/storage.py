from pathlib import Path

from django.conf import settings


def ensure_docs_root() -> Path:
    root = Path(settings.KANZELEI_DOCS_ROOT)
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_akte_directory(aktenzeichen: str) -> Path:
    safe_name = aktenzeichen.replace("/", "_")
    directory = ensure_docs_root() / safe_name
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def store_document(akte, upload) -> str:
    directory = get_akte_directory(akte.aktenzeichen)
    filename = Path(upload.name).name
    target = directory / filename

    with target.open("wb+") as destination:
        for chunk in upload.chunks():
            destination.write(chunk)

    relative_path = f"{akte.aktenzeichen}/{filename}"
    return relative_path

