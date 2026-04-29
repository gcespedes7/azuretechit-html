"""
Generate brand-aligned images for the Azuretech website using Kie.ai API.
Models: Flux Kontext Pro (stills), Kling 2.1 (video loops)

Usage:
    python tools/generate_images.py            # generate all stills
    python tools/generate_images.py --test     # test API auth only (1 image)
    python tools/generate_images.py --videos   # also generate video loops (slow + expensive)

Requirements:
    pip install requests python-dotenv
"""

import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv

# --- Paths ---
BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("KIE_API_KEY")
BASE_URL = "https://api.kie.ai"
IMAGES_OUT = BASE_DIR / "assets" / "generated" / "images"
VIDEOS_OUT = BASE_DIR / "assets" / "generated" / "videos"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

NEGATIVE = "lens flare, fake smile, corporate handshake, stock photo, watermark, oversaturated, blurry"

# ---------------------------------------------------------------------------
# STILL IMAGE PROMPTS — Flux Kontext Pro
# about-founder-portrait.webp is handled by tools/process_portrait.py (real photo)
# ---------------------------------------------------------------------------
IMAGES = [
    {
        "filename": "index-blog-avatar.webp",
        "aspect_ratio": "1:1",
        "prompt": (
            "Portrait photograph of a young professional man, 28-35 years old, "
            "natural warm lighting, slight smile, confident but approachable, "
            "dark background, shallow depth of field, shot on Sony A7IV 85mm f/1.4, "
            "editorial photography style, no tie, modern casual attire, high resolution"
        ),
    },
    {
        "filename": "automation-hero-bg.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Macro photograph of a glowing dark circuit board, traces of electric orange "
            "and deep blue light running through copper pathways, extreme shallow depth of "
            "field, bokeh background, shot on Canon 100mm macro lens, background nearly "
            "black, no text, no people, cinematic mood, high contrast"
        ),
    },
    {
        "filename": "automation-how-we-work.webp",
        "aspect_ratio": "4:3",
        "prompt": (
            "Side-angle photograph of a focused professional reviewing multiple dashboards "
            "on dual monitors, dark modern office environment, screens casting blue and "
            "orange light on face, shallow depth of field on subject, no corporate stock "
            "photo feel, candid working posture, shot on Sony A7III 35mm f/1.8, cinematic "
            "color grade"
        ),
    },
    {
        "filename": "ai-hero-feature.webp",
        "aspect_ratio": "3:4",
        "prompt": (
            "Cinematic 3D isometric render of floating dark geometric platforms "
            "connected by glowing electric orange data beams in a void, central "
            "larger platform acts as hub with smaller satellite blocks orbiting it, "
            "volumetric light rays, deep black background, subtle blue rim lighting "
            "on platform edges, no text, no icons, no logos, ultra sharp center "
            "with soft edge falloff, dramatic contrast, 3:4 portrait"
        ),
    },
    {
        "filename": "ai-strategic-roadmap.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Top-down flat lay of a clean dark desk with a laptop open showing a project "
            "timeline, a notebook with handwritten strategy notes, a single orange coffee "
            "mug, minimal objects, dramatic side lighting, dark wood surface, shot on "
            "Canon 5D Mark IV with 24mm tilt-shift, magazine editorial aesthetic"
        ),
    },
    {
        "filename": "webdesign-hero-bg.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Photorealistic floating browser window mockup glowing in dark space, "
            "displaying a premium dark website with bold orange call-to-action buttons "
            "and a cinematic hero image, soft studio bokeh background, professional "
            "product photography, warm ambient light rim on edges of monitor, no readable "
            "text, no brand names, shot on Sony A7IV 85mm, high contrast"
        ),
    },
    {
        "filename": "webdesign-before.webp",
        "aspect_ratio": "16:9",
        "model": "nano-banana",
        "prompt": (
            "Photorealistic browser screenshot of a generic small business website built "
            "on a drag-and-drop template like Wix or Squarespace, bright white background, "
            "default blue and grey color scheme, stock photo banner of smiling people in "
            "an office, cookie-cutter card grid layout, standard navigation bar at top, "
            "plain sans-serif font, looks functional but completely generic and forgettable, "
            "no unique design, no visible readable text, 16:9"
        ),
    },
    {
        "filename": "webdesign-after.webp",
        "aspect_ratio": "16:9",
        "model": "nano-banana",
        "prompt": (
            "Photorealistic browser screenshot of a custom premium business website, "
            "deep dark background with subtle gradient, bold modern typography for headings, "
            "electric orange accent color on buttons and highlights, full-width cinematic "
            "hero section, glassmorphism service cards, smooth section transitions, "
            "distinctive and memorable professional design, no visible readable text, 16:9"
        ),
    },
    {
        "filename": "social-hero-bg.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Extreme macro photograph of a hand holding a smartphone, screen completely "
            "out of focus and reduced to a wash of orange, pink and blue bokeh light, "
            "dark black background, shot on Sony 90mm macro at f/1.4, no readable text "
            "anywhere, no UI visible, pure abstract light and color, cinematic mood"
        ),
    },
    {
        "filename": "social-email-section.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Flat lay of a dark desk with a laptop showing an email campaign builder "
            "interface, orange CTAs visible on screen, inbox statistics displayed, clean "
            "layout, dramatic side lighting, top-down perspective, minimal props"
        ),
    },
    {
        "filename": "social-team.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Candid photograph of 2-3 young professionals in a modern dark-accented "
            "workspace, collaborating around a monitor showing social media analytics, "
            "warm overhead lighting, orange brand color visible in environment, shot on "
            "Sony 35mm f/1.4, authentic and unposed, no stock photo staging"
        ),
    },
    {
        "filename": "about-workspace-bg.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Wide-angle photograph of a clean minimal workspace, dark desk, dual monitors "
            "with code and dashboards visible, warm ambient lighting with orange accent "
            "lamp, no person present, background slightly blurred, shot on Sony 16-35mm "
            "f/2.8, cinematic mood, dark interior design aesthetic"
        ),
    },
    {
        "filename": "contact-bg-atmosphere.webp",
        "aspect_ratio": "16:9",
        "prompt": (
            "Abstract slow bokeh photograph of a dark office interior at night, warm "
            "orange and blue point lights out of focus, depth of field fully collapsed, "
            "no sharp elements, pure atmosphere, can be used as a subtle background overlay"
        ),
    },
]

# ---------------------------------------------------------------------------
# VIDEO LOOP PROMPTS — Kling 2.1 (text-to-video)
# NOTE: Videos are slow (3-5 min each) and use more API credits.
# Run with --videos flag to include them.
# ---------------------------------------------------------------------------
VIDEOS = [
    {
        "filename": "automation-hero-loop.mp4",
        "duration": 6,
        "prompt": (
            "Slow cinematic zoom into a dark circuit board, electric orange pulses "
            "traveling along circuit traces like data flowing through a network, deep "
            "shadow background, ambient glow, seamless loop, no cuts, no text"
        ),
    },
    {
        "filename": "ai-hero-screen-loop.mp4",
        "duration": 8,
        "prompt": (
            "Close-up of a dark screen where AI text appears character by character in "
            "real time, orange cursor blinking, dark background, no person visible, slow "
            "push-in camera move, ambient workstation environment, seamless loop"
        ),
    },
    {
        "filename": "webdesign-hero-loop.mp4",
        "duration": 8,
        "prompt": (
            "Smooth scroll animation of a beautiful dark-themed website on a large "
            "monitor, orange accent highlights appearing as sections animate in, cinematic "
            "push-in camera move, dark room ambient glow, seamless loop"
        ),
    },
    {
        "filename": "social-hero-phone-loop.mp4",
        "duration": 6,
        "prompt": (
            "Slow cinematic reveal of a phone screen showing a social media feed "
            "populating automatically with content, orange notification pulses, dark "
            "ambient environment, bokeh background, smooth push-in seamless loop"
        ),
    },
    {
        "filename": "global-data-network.mp4",
        "duration": 10,
        "prompt": (
            "Abstract dark visualization of data nodes connecting and pulsing across a "
            "black background, orange connection lines appearing and fading, slow and "
            "meditative camera drift, no text, no faces, seamless loop, 1920x1080"
        ),
    },
    {
        "filename": "global-miami-night.mp4",
        "duration": 12,
        "prompt": (
            "Cinematic aerial time-lapse of Miami city lights at night, traffic light "
            "trails, bay reflecting building glow, camera slowly drifting upward, dark "
            "moody sky, no people identifiable, seamless loop, 1920x1080"
        ),
    },
    {
        "filename": "global-code-terminal.mp4",
        "duration": 8,
        "prompt": (
            "Close-up of dark terminal screen with lines of code appearing in real time, "
            "orange and blue syntax highlighting, very slow push-in camera move, ambient "
            "glow, no identifiable code content, seamless loop, 16:9"
        ),
    },
]


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def submit_image(prompt: str, aspect_ratio: str) -> str:
    """Submit a Flux Kontext Pro generation task. Returns taskId."""
    resp = requests.post(
        f"{BASE_URL}/api/v1/flux/kontext/generate",
        headers=HEADERS,
        json={
            "prompt": prompt,
            "negativePrompt": NEGATIVE,
            "model": "flux-kontext-pro",
            "aspectRatio": aspect_ratio,
            "outputFormat": "jpeg",
            "promptUpsampling": False,
            "safetyTolerance": 2,
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != 200:
        raise RuntimeError(f"API error: {data}")
    return data["data"]["taskId"]


def submit_nano_banana(prompt: str, aspect_ratio: str) -> str:
    """Submit a Nano Banana 2 generation task. Returns taskId."""
    resp = requests.post(
        f"{BASE_URL}/api/v1/jobs/createTask",
        headers=HEADERS,
        json={
            "model": "nano-banana-2",
            "input": {
                "prompt": prompt,
                "image_input": [],
                "aspect_ratio": aspect_ratio,
                "resolution": "1K",
                "output_format": "jpg",
            },
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != 200:
        raise RuntimeError(f"API error: {data}")
    return data["data"]["taskId"]


def submit_video(prompt: str, duration: int) -> str:
    """Submit a Kling 2.1 text-to-video task. Returns taskId."""
    resp = requests.post(
        f"{BASE_URL}/api/v1/jobs/createTask",
        headers=HEADERS,
        json={
            "model": "kling/v2-1",
            "prompt": prompt,
            "duration": duration,
            "mode": "std",
            "aspectRatio": "16:9",
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != 200:
        raise RuntimeError(f"API error: {data}")
    return data["data"]["taskId"]


def poll_task(task_id: str, timeout_sec: int = 600, interval: int = 15) -> str:
    """Poll until task completes. Returns the output URL.
    Flux Kontext tasks use /flux/kontext/record-info;
    Kling/other tasks use /jobs/recordInfo.
    """
    if task_id.startswith("fluxkontext_"):
        poll_url = f"{BASE_URL}/api/v1/flux/kontext/record-info"
    else:
        poll_url = f"{BASE_URL}/api/v1/jobs/recordInfo"

    deadline = time.time() + timeout_sec
    first_poll = True
    while time.time() < deadline:
        resp = requests.get(
            poll_url,
            headers=HEADERS,
            params={"taskId": task_id},
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()

        task = data.get("data") or {}

        # Kie.ai Flux Kontext uses successFlag: 0=pending, 1=success
        # errorCode != null means failure
        success_flag = task.get("successFlag", 0)
        error_code = task.get("errorCode")
        response_raw = task.get("response")

        if first_poll:
            print(f"        [debug] successFlag={success_flag} state={task.get('state')} errorCode={error_code} response={str(response_raw)[:80]}")
            first_poll = False

        if error_code:
            raise RuntimeError(f"Task failed — errorCode={error_code}: {task.get('errorMessage')}")

        # Nano Banana uses state: "success" + resultJson (stringified JSON with resultUrls[])
        if task.get("state") == "success":
            result_json_raw = task.get("resultJson", "{}")
            result = json.loads(result_json_raw) if isinstance(result_json_raw, str) else result_json_raw
            urls = result.get("resultUrls", [])
            if urls:
                return urls[0]
            raise RuntimeError(f"Nano Banana task succeeded but resultUrls is empty: {result_json_raw}")

        # Flux Kontext Pro uses successFlag: 1 + response dict with resultImageUrl
        if success_flag == 1 and response_raw:
            # response is a dict: {"resultImageUrl": "https://...", "originImageUrl": null}
            if isinstance(response_raw, dict):
                url = response_raw.get("resultImageUrl") or response_raw.get("url")
                if not url:
                    result_urls = response_raw.get("resultUrls") or []
                    url = result_urls[0] if result_urls else None
                if url:
                    return url
            elif isinstance(response_raw, str):
                if response_raw.startswith("http"):
                    return response_raw
                try:
                    result = json.loads(response_raw)
                    url = result.get("resultImageUrl") or result.get("url")
                    if url:
                        return url
                except json.JSONDecodeError:
                    pass
            raise RuntimeError(f"Task succeeded but could not extract URL from: {response_raw}")

        print(f"    [wait] successFlag={success_flag} state={task.get('state')} completeTime={task.get('completeTime')} — retrying in {interval}s...")
        time.sleep(interval)

    raise TimeoutError(f"Task {task_id} did not complete within {timeout_sec}s")


def download(url: str, dest: Path):
    """Download a file and save as WebP (converting from JPEG if needed)."""
    from io import BytesIO
    from PIL import Image

    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    dest.parent.mkdir(parents=True, exist_ok=True)

    if dest.suffix.lower() == ".webp":
        img = Image.open(BytesIO(resp.content)).convert("RGB")
        img.save(str(dest), "WEBP", quality=88)
    else:
        dest.write_bytes(resp.content)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(test_mode: bool = False, include_videos: bool = False):
    if not API_KEY:
        print("ERROR: KIE_API_KEY not found in .env")
        sys.exit(1)

    print(f"Kie.ai image generator — {'TEST MODE (1 image)' if test_mode else 'full run'}")
    print(f"Output: {IMAGES_OUT}\n")

    images_to_run = IMAGES[:1] if test_mode else IMAGES
    errors = []

    for img in images_to_run:
        dest = IMAGES_OUT / img["filename"]
        if dest.exists():
            print(f"  [SKIP] {img['filename']} (already exists)")
            continue

        model = img.get("model", "flux")
        print(f"  [-->] Submitting {img['filename']} ({img['aspect_ratio']}) via {model}...")
        try:
            if model == "nano-banana":
                task_id = submit_nano_banana(img["prompt"], img["aspect_ratio"])
            else:
                task_id = submit_image(img["prompt"], img["aspect_ratio"])
            print(f"        taskId: {task_id}")
            url = poll_task(task_id)
            print(f"        Downloading from {url[:60]}...")
            download(url, dest)
            print(f"  [OK]  {img['filename']}")
        except Exception as e:
            print(f"  [ERR] {img['filename']}: {e}")
            errors.append((img["filename"], str(e)))

        if not test_mode:
            time.sleep(2)  # be polite to the API

    if include_videos and not test_mode:
        print(f"\nVideo loops — Kling 2.1 ({len(VIDEOS)} videos, this will take a while)...")
        for vid in VIDEOS:
            dest = VIDEOS_OUT / vid["filename"]
            if dest.exists():
                print(f"  [SKIP] {vid['filename']} (already exists)")
                continue

            print(f"  [-->] Submitting {vid['filename']} ({vid['duration']}s)...")
            try:
                task_id = submit_video(vid["prompt"], vid["duration"])
                print(f"        taskId: {task_id} — polling (videos take 3-5 min)...")
                url = poll_task(task_id, timeout_sec=900, interval=30)
                download(url, dest)
                print(f"  [OK]  {vid['filename']}")
            except Exception as e:
                print(f"  [ERR] {vid['filename']}: {e}")
                errors.append((vid["filename"], str(e)))

    print(f"\n{'-'*50}")
    if errors:
        print(f"Completed with {len(errors)} error(s):")
        for name, err in errors:
            print(f"  [ERR] {name}: {err}")
    else:
        print("All done!")

    if test_mode:
        print("\nTest passed — run without --test to generate all images.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kie.ai image generator for Azuretech")
    parser.add_argument("--test", action="store_true", help="Test API auth with 1 image only")
    parser.add_argument("--videos", action="store_true", help="Also generate Kling video loops")
    args = parser.parse_args()
    run(test_mode=args.test, include_videos=args.videos)
