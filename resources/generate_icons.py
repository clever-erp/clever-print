"""Placeholder icon generator for clever-print v0.1.0.

Replace the output files with real artwork in a later release; this script
exists only to unblock the first electron-builder run.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent

GREEN = (34, 197, 94, 255)
YELLOW = (234, 179, 8, 255)
RED = (239, 68, 68, 255)
DARK = (15, 23, 42, 255)


def tray_dot(path: Path, color: tuple) -> None:
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([2, 2, 30, 30], fill=color)
    img.save(path)


def app_icon() -> Image.Image:
    img = Image.new("RGBA", (256, 256), DARK)
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 130)
    except OSError:
        font = ImageFont.load_default()
    d.text((128, 138), "CP", font=font, fill=GREEN, anchor="mm")
    return img


def main() -> None:
    tray_dot(HERE / "tray-idle.png", GREEN)
    tray_dot(HERE / "tray-busy.png", YELLOW)
    tray_dot(HERE / "tray-error.png", RED)

    icon = app_icon()
    icon.save(HERE / "icon.png")
    icon.save(
        HERE / "icon.ico",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )
    print("Generated:", *(p.name for p in sorted(HERE.glob("*.p*g"))), "icon.ico")


if __name__ == "__main__":
    main()
