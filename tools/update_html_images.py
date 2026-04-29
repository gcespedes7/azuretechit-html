"""
Swap Unsplash placeholder image URLs in all 7 Azuretech HTML files
with locally generated images from assets/generated/images/.

Usage:
    python tools/update_html_images.py --dry-run   # preview changes only
    python tools/update_html_images.py             # apply changes

Run this after generate_images.py has completed.
"""

import re
import sys
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
IMAGES_DIR = BASE_DIR / "assets" / "generated" / "images"

# Map: Unsplash photo ID (partial) → local generated filename
# Format: ("unsplash_fragment_to_match", "local_filename")
REPLACEMENTS = [
    # index.html
    ("photo-1472099645785", "index-blog-avatar.webp"),

    # automation.html
    ("photo-1518770660439", "automation-hero-bg.webp"),        # circuit board hero
    ("photo-1600880292203", "automation-how-we-work.webp"),    # workstation section

    # ai-integration.html
    ("photo-1531297484001", "ai-hero-feature.webp"),           # dark laptop
    ("photo-1550745165",    "ai-strategic-roadmap.webp"),      # monitor array / roadmap

    # web-design.html
    ("photo-1547658719",    "webdesign-hero-bg.webp"),         # web mockup hero

    # social-media.html
    ("photo-1611162617474", "social-hero-bg.webp"),            # social phone
    ("photo-1611162616305", "social-email-section.webp"),      # content scheduling
    ("photo-1557804506",    "social-team.webp"),               # creative team

    # about.html
    ("photo-1507003211169", "about-founder-portrait.webp"),    # Giovanni portrait
    # about workspace bg uses a different Unsplash image — add if visible in HTML

    # contact.html — no current image, this is an optional addition
    # ("contact-bg-atmosphere", handled separately if added to HTML)
]

HTML_FILES = [
    "index.html",
    "automation.html",
    "ai-integration.html",
    "web-design.html",
    "social-media.html",
    "about.html",
    "contact.html",
]


def make_local_path(filename: str) -> str:
    """Return relative path for use in HTML src attributes."""
    return f"assets/generated/images/{filename}"


def process_file(html_path: Path, replacements: list, dry_run: bool) -> int:
    """Apply replacements to a single HTML file. Returns count of changes."""
    content = html_path.read_text(encoding="utf-8")
    original = content
    changes = 0

    for unsplash_fragment, local_file in replacements:
        local_path = make_local_path(local_file)
        local_full = IMAGES_DIR / local_file

        if unsplash_fragment not in content:
            continue  # not in this file

        if not local_full.exists():
            print(f"  [SKIP] {local_file} not yet generated — skipping {unsplash_fragment}")
            continue

        # Replace Unsplash src URLs — matches:
        # src="https://images.unsplash.com/photo-XXXXX?..."
        # Also handles srcset variations
        pattern = rf'(https://images\.unsplash\.com/{re.escape(unsplash_fragment)}[^"\']*)'
        new_content = re.sub(pattern, local_path, content)

        if new_content != content:
            count = len(re.findall(pattern, content))
            print(f"  [->] {unsplash_fragment[:30]}... => {local_file} ({count} occurrence(s))")
            content = new_content
            changes += count

    if changes > 0 and not dry_run:
        html_path.write_text(content, encoding="utf-8")

    return changes


def run(dry_run: bool):
    mode = "DRY RUN" if dry_run else "APPLYING CHANGES"
    print(f"HTML image updater — {mode}")
    print(f"Images dir: {IMAGES_DIR}\n")

    total = 0
    for filename in HTML_FILES:
        path = BASE_DIR / filename
        if not path.exists():
            continue
        print(f"{filename}:")
        count = process_file(path, REPLACEMENTS, dry_run)
        if count == 0:
            print(f"  (no changes)")
        total += count

    print(f"\n{'-'*50}")
    action = "Would change" if dry_run else "Changed"
    print(f"{action} {total} URL(s) across {len(HTML_FILES)} files.")
    if dry_run and total > 0:
        print("Run without --dry-run to apply.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Preview only, don't write files")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
