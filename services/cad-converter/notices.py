"""Pemberitahuan pihak ketiga untuk paket Python yang terpasang: python notices.py > berkas.

Dijalankan saat build image (deploy/Dockerfile) agar daftar dan teks lisensi sama persis dengan
paket di dalam image. Paket pip sendiri (alat pasang, bukan bagian layanan) tidak dicantumkan.
"""

from __future__ import annotations

import sys
from importlib.metadata import Distribution, distributions

SKIP = {"pip", "setuptools", "wheel"}
RULE = "=" * 72


def license_of(dist: Distribution) -> str:
    meta = dist.metadata
    expression = meta.get("License-Expression")
    if expression:
        return expression
    classifiers = [c.rsplit(" :: ", 1)[-1] for c in meta.get_all("Classifier") or [] if c.startswith("License ::")]
    if classifiers:
        return ", ".join(classifiers)
    short = (meta.get("License") or "").strip()
    return short if short and "\n" not in short else "lihat teks lisensi"


def license_text(dist: Distribution) -> str:
    texts = []
    for file in sorted(dist.files or [], key=str):
        name = file.name.lower()
        if "licen" in name or "copying" in name or name.startswith("notice"):
            try:
                texts.append(file.read_text(encoding="utf-8").strip())
            except (OSError, UnicodeDecodeError):
                continue
    return "\n\n".join(texts) or "Paket tidak menyertakan berkas lisensi."


def main() -> None:
    dists = sorted(
        (d for d in distributions() if d.metadata["Name"].lower() not in SKIP),
        key=lambda d: d.metadata["Name"].lower(),
    )
    out = [
        "PanduArah cad-converter — pemberitahuan pihak ketiga",
        "",
        "Paket Python di dalam image ini beserta teks lisensinya, dibuat otomatis saat build.",
        "",
    ]
    out += [f"- {d.metadata['Name']} {d.version} ({license_of(d)})" for d in dists]
    for d in dists:
        out += ["", RULE, f"{d.metadata['Name']} {d.version}", f"Lisensi: {license_of(d)}", "", license_text(d)]
    sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
