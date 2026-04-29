"""
Process Giovanni's real headshot into a branded Azuretech founder portrait.

Usage:
    python tools/process_portrait.py

Input:  assets/source-photos/giovanni-headshot.jpg
Output: assets/generated/images/about-founder-portrait.webp

Requirements:
    pip install rembg pillow
"""

import sys
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent
# Support both .jpg and .jpeg extensions
_src = BASE_DIR / "assets" / "source-photos"
INPUT_PATH = next(
    (p for p in [_src / "giovanni-headshot.jpg", _src / "giovanni-headshot.jpeg"] if p.exists()),
    _src / "giovanni-headshot.jpg"
)
OUTPUT_PATH = BASE_DIR / "assets" / "generated" / "images" / "about-founder-portrait.webp"

# Background: warm light gray — close to the original photo backdrop, hides edge artifacts
BG_COLOR = (242, 241, 239)        # warm off-white / light gray
GLOW_COLOR = (240, 148, 46, 12)   # very subtle orange hint at bottom — barely visible


def check_dependencies():
    try:
        import rembg
        from PIL import Image, ImageDraw, ImageFilter
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Install with: pip install rembg pillow")
        return False


def create_radial_glow(size, color_rgba, radius_fraction=0.55):
    """Create a soft radial glow gradient image (RGBA)."""
    from PIL import Image
    import math

    w, h = size
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    pixels = glow.load()
    cx, cy = w // 2, h * 0.85  # glow center near bottom — subtle warm shadow
    r = min(w, h) * radius_fraction
    cr, cg, cb, ca = color_rgba

    for y in range(h):
        for x in range(w):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            factor = max(0.0, 1.0 - (dist / r))
            alpha = int(ca * factor * factor)  # quadratic falloff = softer edge
            pixels[x, y] = (cr, cg, cb, alpha)

    return glow


def process_portrait():
    if not check_dependencies():
        sys.exit(1)

    from rembg import remove
    from PIL import Image

    if not INPUT_PATH.exists():
        print(f"ERROR: Source photo not found at {INPUT_PATH}")
        print("Save the headshot photo to that path and re-run.")
        sys.exit(1)

    print(f"Loading source photo: {INPUT_PATH}")
    with open(INPUT_PATH, "rb") as f:
        input_data = f.read()

    print("Removing background (this may take 10-30s on first run — model download)...")
    output_data = remove(input_data)

    from io import BytesIO
    subject = Image.open(BytesIO(output_data)).convert("RGBA")

    # --- Determine canvas size ---
    # Target: square 1024x1024, crop to show head + shoulders
    TARGET_SIZE = (1024, 1024)
    sw, sh = subject.size

    # Scale subject so it fills ~80% of canvas height
    scale = (TARGET_SIZE[1] * 0.85) / sh
    new_w = int(sw * scale)
    new_h = int(sh * scale)
    subject = subject.resize((new_w, new_h), Image.LANCZOS)

    # --- Build canvas ---
    canvas = Image.new("RGBA", TARGET_SIZE, (*BG_COLOR, 255))

    # Add radial orange glow behind subject
    print("Adding brand background glow...")
    glow = create_radial_glow(TARGET_SIZE, GLOW_COLOR, radius_fraction=0.5)
    canvas = Image.alpha_composite(canvas, glow)

    # Center subject horizontally, anchor to bottom
    x = (TARGET_SIZE[0] - new_w) // 2
    y = TARGET_SIZE[1] - new_h  # flush to bottom
    canvas.paste(subject, (x, y), subject)

    # Convert to RGB for WebP output
    final = canvas.convert("RGB")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    final.save(str(OUTPUT_PATH), "WEBP", quality=92)
    print(f"Saved: {OUTPUT_PATH}")
    print("Done! Open the file to review before updating about.html.")


if __name__ == "__main__":
    process_portrait()
