"""Pluggable storage backend.

The rest of the application depends only on the :class:`StorageBackend`
interface, obtained via :func:`get_storage`. Switching from local disk to
MinIO / AWS S3 is a configuration change (``STORAGE_BACKEND=s3``) — no business
logic changes are required.
"""
from __future__ import annotations

import hashlib
import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO

from app.core.config import settings


class StorageBackend(ABC):
    """Abstract object storage interface."""

    @abstractmethod
    def save(self, key: str, fileobj: BinaryIO) -> tuple[int, str]:
        """Persist a stream at ``key``; return ``(size_bytes, sha256_hex)``."""

    @abstractmethod
    def open(self, key: str) -> BinaryIO:
        """Return a readable binary stream for ``key``."""

    @abstractmethod
    def delete(self, key: str) -> None:
        ...

    @abstractmethod
    def exists(self, key: str) -> bool:
        ...

    @abstractmethod
    def url(self, key: str) -> str | None:
        """Return a direct/pre-signed URL when the backend supports it."""


class LocalStorage(StorageBackend):
    """Stores objects on the local filesystem under ``STORAGE_LOCAL_PATH``."""

    def __init__(self, base_path: str) -> None:
        self.base = Path(base_path).resolve()
        self.base.mkdir(parents=True, exist_ok=True)

    def _full(self, key: str) -> Path:
        # Prevent path traversal outside the storage root.
        target = (self.base / key).resolve()
        if not str(target).startswith(str(self.base)):
            raise ValueError("Invalid storage key")
        return target

    def save(self, key: str, fileobj: BinaryIO) -> tuple[int, str]:
        target = self._full(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        hasher = hashlib.sha256()
        size = 0
        with open(target, "wb") as out:
            while True:
                chunk = fileobj.read(1024 * 1024)
                if not chunk:
                    break
                hasher.update(chunk)
                size += len(chunk)
                out.write(chunk)
        return size, hasher.hexdigest()

    def open(self, key: str) -> BinaryIO:
        return open(self._full(key), "rb")

    def delete(self, key: str) -> None:
        target = self._full(key)
        if target.exists():
            target.unlink()

    def exists(self, key: str) -> bool:
        return self._full(key).exists()

    def url(self, key: str) -> str | None:
        # Local files are streamed through the API, no direct URL.
        return None


class S3Storage(StorageBackend):
    """MinIO / AWS S3 backend (activated when ``STORAGE_BACKEND=s3``).

    boto3 is imported lazily so the dependency is optional for local dev.
    """

    def __init__(self) -> None:
        import boto3  # type: ignore

        self._bucket = settings.S3_BUCKET
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
        )

    def save(self, key: str, fileobj: BinaryIO) -> tuple[int, str]:
        # Buffer to compute checksum while uploading.
        hasher = hashlib.sha256()
        size = 0
        tmp = f"/tmp/{hashlib.md5(key.encode()).hexdigest()}"
        with open(tmp, "wb") as buf:
            while True:
                chunk = fileobj.read(1024 * 1024)
                if not chunk:
                    break
                hasher.update(chunk)
                size += len(chunk)
                buf.write(chunk)
        self._client.upload_file(tmp, self._bucket, key)
        os.remove(tmp)
        return size, hasher.hexdigest()

    def open(self, key: str) -> BinaryIO:
        obj = self._client.get_object(Bucket=self._bucket, Key=key)
        return obj["Body"]

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)

    def exists(self, key: str) -> bool:
        from botocore.exceptions import ClientError  # type: ignore

        try:
            self._client.head_object(Bucket=self._bucket, Key=key)
            return True
        except ClientError:
            return False

    def url(self, key: str) -> str | None:
        return self._client.generate_presigned_url(
            "get_object", Params={"Bucket": self._bucket, "Key": key}, ExpiresIn=3600
        )


_backend: StorageBackend | None = None


def get_storage() -> StorageBackend:
    """Return the singleton storage backend selected by configuration."""
    global _backend
    if _backend is None:
        if settings.STORAGE_BACKEND == "s3":
            _backend = S3Storage()
        else:
            _backend = LocalStorage(settings.STORAGE_LOCAL_PATH)
    return _backend
