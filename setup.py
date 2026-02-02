"""Minimal setup so pip install -e . works; this repo is Node + one Python app (main.py)."""
from setuptools import setup

setup(
    name="repl-nix-workspace",
    version="0.1.0",
    description="Deuncify video processor (Node + Python FastAPI app)",
    python_requires=">=3.11",
    packages=[],
    py_modules=["main"],
    install_requires=[
        "fastapi>=0.128.0",
        "moviepy>=2.2.1",
        "python-magic>=0.4.27",
        "python-multipart>=0.0.22",
        "uvicorn>=0.40.0",
    ],
)
