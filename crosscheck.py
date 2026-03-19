#!/usr/bin/env python3
"""
crosscheck.py — Batch evaluate TruthLens ML predictions against labelled ground truth.
                Optionally cross-validates each prediction with GPT-4o as a second opinion.

QUICK SANITY CHECK (no dataset files needed):
    python crosscheck.py --probe
    python crosscheck.py --probe --openai-key sk-...

BATCH EVALUATION against a labelled CSV:
    python crosscheck.py --csv datasets/fakeavceleb_100.csv --base-dir /path/to/FakeAVCeleb
    python crosscheck.py --csv datasets/fakeavceleb_100.csv --base-dir /path/to/FakeAVCeleb --openai-key sk-...

OPTIONS:
    --csv          CSV file with labelled ground-truth paths (default: datasets/fakeavceleb_100.csv)
    --base-dir     Root folder prepended to paths inside the CSV (default: .)
    --type         Media type: image | video | audio  (default: video)
    --limit        Max samples to test — useful for a quick spot-check
    --col-path     CSV column that holds the file path  (default: video_path)
    --col-label    CSV column that holds the label      (default: label)
    --probe        Run a quick synthetic sanity-check via /api/probe instead of CSV eval
    --ml-url       ML service base URL                  (default: http://127.0.0.1:8001)
    --openai-key   OpenAI API key for GPT-4o second-opinion (also reads OPENAI_API_KEY env var)
    --openai-model GPT model to use for vision analysis  (default: gpt-4o)
"""

import argparse
import base64
import csv
import os
import sys
import tempfile
from pathlib import Path

import requests

# Auto-load .env if present (so OPENAI_API_KEY is available without --openai-key)
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

# ── Optional OpenAI import ────────────────────────────────────────────────────
try:
    from openai import OpenAI as _OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False

# ── Optional cv2 for video frame extraction ───────────────────────────────────
try:
    import cv2 as _cv2
    _CV2_AVAILABLE = True
except ImportError:
    _CV2_AVAILABLE = False


# ── OpenAI helpers ────────────────────────────────────────────────────────────

_VISION_PROMPT = (
    "You are a deepfake and AI-generated media detection expert.\n"
    "Carefully examine the image provided.\n"
    "Decide whether it is authentic/unmanipulated (REAL) or AI-generated/synthetically "
    "altered/deepfaked (FAKE).\n"
    "Reply with exactly one word — either REAL or FAKE — and nothing else."
)

_VIDEO_PROMPT = (
    "You are a deepfake and AI-generated media detection expert.\n"
    "Below are evenly-spaced frames sampled from a short video clip.\n"
    "Examine them carefully for signs of deepfake manipulation, unnatural textures, "
    "face-swapping artefacts, or AI generation.\n"
    "Decide: is this video authentic/unmanipulated (REAL) or a deepfake/AI-generated (FAKE)?\n"
    "Reply with exactly one word — either REAL or FAKE — and nothing else."
)


def _encode_image_b64(path: str) -> str:
    """Return a base64-encoded JPEG string for an image file."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _extract_video_frames_b64(video_path: str, n: int = 4) -> list[str]:
    """Extract n evenly-spaced frames from a video, return as base64 JPEG strings."""
    if not _CV2_AVAILABLE:
        raise RuntimeError("cv2 not available — cannot extract video frames for OpenAI")
    cap = _cv2.VideoCapture(video_path)
    total = int(cap.get(_cv2.CAP_PROP_FRAME_COUNT)) or 100
    indices = set(int(i) for i in [total * k // (n + 1) for k in range(1, n + 1)])
    frames_b64 = []
    idx = 0
    while len(frames_b64) < n:
        ok, frame = cap.read()
        if not ok:
            break
        if idx in indices:
            _, buf = _cv2.imencode(".jpg", frame, [_cv2.IMWRITE_JPEG_QUALITY, 70])
            frames_b64.append(base64.b64encode(buf.tobytes()).decode("utf-8"))
        idx += 1
    cap.release()
    return frames_b64


def ask_openai(file_path: str, media_type: str, client) -> dict | None:
    """
    Send file to GPT-4o and return {"label": "REAL"|"FAKE", "reason": "..."}.
    Returns None if the media type is not supported (audio).
    """
    try:
        if media_type == "image":
            b64 = _encode_image_b64(file_path)
            content = [
                {"type": "text",       "text": _VISION_PROMPT},
                {"type": "image_url",  "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "low"}},
            ]
            prompt = _VISION_PROMPT

        elif media_type == "video":
            frames = _extract_video_frames_b64(file_path, n=4)
            if not frames:
                return {"label": "ERROR", "reason": "no frames extracted"}
            content = [{"type": "text", "text": _VIDEO_PROMPT}]
            for b64 in frames:
                content.append({"type": "image_url",
                                 "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "low"}})

        elif media_type == "audio":
            # GPT-4o vision cannot analyse raw audio waveforms for deepfake detection
            return None

        else:
            return None

        response = client.chat.completions.create(
            model=client._crosscheck_model,   # injected below
            messages=[{"role": "user", "content": content}],
            max_tokens=5,
            temperature=0,
        )
        raw = response.choices[0].message.content.strip().upper()
        label = "REAL" if "REAL" in raw else ("FAKE" if "FAKE" in raw else "UNKNOWN")
        return {"label": label, "raw": raw}

    except Exception as exc:
        return {"label": "ERROR", "reason": str(exc)}


def _make_openai_client(api_key: str, model: str):
    if not _OPENAI_AVAILABLE:
        print("ERROR: openai package not installed. Run: pip install openai")
        sys.exit(1)
    client = _OpenAI(api_key=api_key)
    client._crosscheck_model = model   # carry the model name with the client
    return client


# ── helpers ──────────────────────────────────────────────────────────────────

def check_service(ml_url: str) -> bool:
    try:
        r = requests.get(f"{ml_url}/", timeout=6)
        return r.status_code == 200
    except Exception:
        return False


def run_probe(ml_url: str, openai_client=None):
    """Hit the /api/probe endpoint and optionally cross-check with GPT-4o."""
    print(f"Calling {ml_url}/api/probe …")
    try:
        r = requests.get(f"{ml_url}/api/probe", timeout=60)
    except Exception as exc:
        print(f"ERROR: could not reach probe endpoint — {exc}")
        sys.exit(1)

    if r.status_code != 200:
        print(f"ERROR {r.status_code}: {r.text}")
        sys.exit(1)

    data = r.json()
    print()
    print("=" * 58)
    print("  PROBE RESULTS")
    print("=" * 58)
    overall = "✓ PASS" if data.get("probe_ok") else "✗ FAIL"
    print(f"  Our model overall : {overall}")
    print()

    for modality, info in data.get("results", {}).items():
        status = info.get("status", "?")
        print(f"  [{modality.upper()}]")
        if status == "ok":
            label_ok = "✓" if info.get("label_valid") else "✗ (invalid)"
            conf_ok  = "✓" if info.get("confidence_valid") else "✗ (out of range)"
            print(f"    Our model  → label={info.get('label')} {label_ok}  "
                  f"conf={info.get('confidence')}% {conf_ok}")
        else:
            print(f"    Our model  → ERROR: {info.get('detail')}")

        # OpenAI cross-check for the image probe using a fresh synthetic grey JPEG
        if openai_client and modality == "image":
            try:
                import numpy as np
                import cv2
                grey = np.full((256, 256, 3), 127, dtype=np.uint8)
                _, buf = cv2.imencode(".jpg", grey)
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                    tmp.write(buf.tobytes())
                    tmp_path = tmp.name
                gpt_result = ask_openai(tmp_path, "image", openai_client)
                os.remove(tmp_path)
                if gpt_result:
                    agree = ("✓ AGREE" if gpt_result["label"] == info.get("label")
                             else "✗ DISAGREE")
                    print(f"    GPT-4o     → label={gpt_result['label']}  [{agree}]")
            except Exception as exc:
                print(f"    GPT-4o     → ERROR: {exc}")
        elif openai_client and modality == "audio":
            print(f"    GPT-4o     → (audio deepfake detection not supported via vision API)")
        print()

    print("=" * 58)


def run_batch(csv_path: str, base_dir: str, media_type: str,
              limit: int | None, col_path: str, col_label: str,
              ml_url: str, openai_client=None):
    endpoint = f"{ml_url}/api/detect/{media_type}"

    with open(csv_path, newline="") as fh:
        rows = list(csv.DictReader(fh))

    if limit:
        rows = rows[:limit]

    total   = len(rows)
    # Our model stats
    tp = tn = fp = fn = skipped = 0
    conf_correct: list[float] = []
    conf_wrong:   list[float] = []
    # OpenAI stats
    gpt_tp = gpt_tn = gpt_fp = gpt_fn = gpt_skip = 0
    agree_count = 0
    both_evaluated = 0

    use_gpt = openai_client is not None and media_type in ("image", "video")
    header = f"{'GT':<5} {'Our':>4} {'C%':>7}" + (f"  {'GPT-4o':>6}  {'Match'}" if use_gpt else "")
    print(f"Evaluating {total} samples → {endpoint}")
    if use_gpt:
        print("  GPT-4o cross-check: ON")
    print("-" * 70)
    print(f"  # / Total  {header}  filename")
    print("-" * 70)

    for i, row in enumerate(rows, 1):
        rel_path  = row.get(col_path, "").strip()
        gt_label  = row.get(col_label, "").strip().lower()   # "real" / "fake"
        file_path = Path(base_dir) / rel_path

        if not file_path.exists():
            print(f"[{i:>4}/{total}] SKIP  (not found) {rel_path}")
            skipped += 1
            continue

        # ── Our model ──────────────────────────────────────────────────────
        try:
            with open(file_path, "rb") as f:
                resp = requests.post(endpoint, files={"file": f}, timeout=120)
        except requests.RequestException as exc:
            print(f"[{i:>4}/{total}] ERROR (request) {exc}")
            skipped += 1
            continue

        if resp.status_code != 200:
            print(f"[{i:>4}/{total}] ERROR {resp.status_code}: {resp.text[:80]}")
            skipped += 1
            continue

        payload     = resp.json()
        result      = payload.get("result", payload)
        pred_label  = result.get("label", "").upper()
        confidence  = float(result.get("confidence", 0))
        our_correct = pred_label.lower() == gt_label

        if   gt_label == "real" and pred_label == "REAL": tp += 1
        elif gt_label == "fake" and pred_label == "FAKE": tn += 1
        elif gt_label == "real" and pred_label == "FAKE": fn += 1
        else:                                             fp += 1

        (conf_correct if our_correct else conf_wrong).append(confidence)
        our_mark = "✓" if our_correct else "✗"

        # ── GPT-4o cross-check ─────────────────────────────────────────────
        gpt_col = ""
        match_col = ""
        if use_gpt:
            gpt_result = ask_openai(str(file_path), media_type, openai_client)
            if gpt_result and gpt_result["label"] not in ("ERROR", "UNKNOWN", None):
                gpt_pred  = gpt_result["label"]
                gpt_ok    = gpt_pred.lower() == gt_label
                if   gt_label == "real" and gpt_pred == "REAL": gpt_tp += 1
                elif gt_label == "fake" and gpt_pred == "FAKE": gpt_tn += 1
                elif gt_label == "real" and gpt_pred == "FAKE": gpt_fn += 1
                else:                                            gpt_fp += 1
                both_evaluated += 1
                if pred_label == gpt_pred:
                    agree_count += 1
                gpt_mark  = "✓" if gpt_ok else "✗"
                match_mark = "=" if pred_label == gpt_pred else "≠"
                gpt_col   = f"  {gpt_mark}{gpt_pred:<4}  {match_mark}"
            else:
                gpt_col = f"  {'ERR':<6}  -"
                gpt_skip += 1

        print(f"[{i:>4}/{total}] {our_mark}  gt={gt_label:<4}  {pred_label:<4} {confidence:6.2f}%"
              f"{gpt_col}  {file_path.name}")

    # ── summary ───────────────────────────────────────────────────────────────
    evaluated = tp + tn + fp + fn
    print()
    print("=" * 58)
    print("  CROSS-CHECK RESULTS")
    print("=" * 58)

    if evaluated == 0:
        print("  No files were evaluated.")
        print(f"  Skipped : {skipped}")
        print()
        print("  Tip: make sure --base-dir points to the folder that")
        print("  contains the dataset (e.g. --base-dir /data/FakeAVCeleb)")
        print("=" * 58)
        return

    accuracy  = (tp + tn) / evaluated * 100
    precision = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0.0
    recall    = tp / (tp + fn) * 100 if (tp + fn) > 0 else 0.0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0.0)
    avg_c_ok  = sum(conf_correct) / len(conf_correct) if conf_correct else 0.0
    avg_c_bad = sum(conf_wrong)   / len(conf_wrong)   if conf_wrong   else 0.0

    print(f"  Evaluated : {evaluated}  (skipped {skipped})")
    print()
    print("  ── Our Model ──────────────────────────────────────")
    print(f"  Accuracy  : {accuracy:.2f}%")
    print(f"  Precision : {precision:.2f}%")
    print(f"  Recall    : {recall:.2f}%")
    print(f"  F1 Score  : {f1:.2f}%")
    print(f"  Confusion Matrix (REAL = positive class):")
    print(f"                    Pred REAL   Pred FAKE")
    print(f"  Actual REAL →     TP={tp:<6}    FN={fn}")
    print(f"  Actual FAKE →     FP={fp:<6}    TN={tn}")
    print(f"  Avg conf (correct) : {avg_c_ok:.1f}%   (wrong) : {avg_c_bad:.1f}%")

    if use_gpt and both_evaluated > 0:
        gpt_acc  = (gpt_tp + gpt_tn) / both_evaluated * 100
        gpt_prec = gpt_tp / (gpt_tp + gpt_fp) * 100 if (gpt_tp + gpt_fp) > 0 else 0.0
        gpt_rec  = gpt_tp / (gpt_tp + gpt_fn) * 100 if (gpt_tp + gpt_fn) > 0 else 0.0
        gpt_f1   = (2 * gpt_prec * gpt_rec / (gpt_prec + gpt_rec)
                    if (gpt_prec + gpt_rec) > 0 else 0.0)
        agree_pct = agree_count / both_evaluated * 100

        print()
        print("  ── GPT-4o Cross-Check ─────────────────────────────")
        print(f"  Evaluated : {both_evaluated}  (skipped/error {gpt_skip})")
        print(f"  Accuracy  : {gpt_acc:.2f}%")
        print(f"  Precision : {gpt_prec:.2f}%")
        print(f"  Recall    : {gpt_rec:.2f}%")
        print(f"  F1 Score  : {gpt_f1:.2f}%")
        print(f"  Confusion Matrix (REAL = positive class):")
        print(f"                    Pred REAL   Pred FAKE")
        print(f"  Actual REAL →     TP={gpt_tp:<6}    FN={gpt_fn}")
        print(f"  Actual FAKE →     FP={gpt_fp:<6}    TN={gpt_tn}")
        print()
        print(f"  ── Agreement ──────────────────────────────────────")
        print(f"  Our model vs GPT-4o agree on : {agree_count}/{both_evaluated} ({agree_pct:.1f}%)")
        if agree_pct >= 80:
            print("  ✓ High agreement — model predictions are consistent with GPT-4o")
        elif agree_pct >= 60:
            print("  ~ Moderate agreement — some discrepancies, review edge cases")
        else:
            print("  ✗ Low agreement — model may need retraining or tuning")

    print("=" * 58)



# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Cross-check TruthLens ML predictions vs ground-truth labels",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--probe",        action="store_true",
                        help="Run synthetic probe check only (no CSV needed)")
    parser.add_argument("--csv",          default="datasets/fakeavceleb_100.csv",
                        help="CSV file with labelled media paths")
    parser.add_argument("--base-dir",     default=".",
                        help="Root dir prepended to paths in the CSV")
    parser.add_argument("--type",         choices=["image", "video", "audio"],
                        default="video",  help="Media type to evaluate")
    parser.add_argument("--limit",        type=int, default=None,
                        help="Evaluate only the first N rows")
    parser.add_argument("--col-path",     default="video_path",
                        help="CSV column for file path")
    parser.add_argument("--col-label",    default="label",
                        help="CSV column for ground-truth label (real/fake)")
    parser.add_argument("--ml-url",       default="http://127.0.0.1:8001",
                        help="ML service base URL")
    parser.add_argument("--openai-key",   default=None,
                        help="OpenAI API key (also reads OPENAI_API_KEY env var)")
    parser.add_argument("--openai-model", default="gpt-4o",
                        help="OpenAI model to use for vision analysis (default: gpt-4o)")
    args = parser.parse_args()

    # ── resolve OpenAI key ────────────────────────────────────────────────────
    openai_key = args.openai_key or os.environ.get("OPENAI_API_KEY")
    openai_client = None
    if openai_key:
        if not _OPENAI_AVAILABLE:
            print("WARNING: --openai-key provided but 'openai' package is not installed.")
            print("         Run: pip install openai")
        else:
            openai_client = _make_openai_client(openai_key, args.openai_model)
            print(f"OpenAI cross-check enabled ({args.openai_model})")
    else:
        print("OpenAI cross-check disabled (pass --openai-key sk-... to enable)")

    # ── service reachability check ────────────────────────────────────────────
    if not check_service(args.ml_url):
        print(f"ERROR: ML service not reachable at {args.ml_url}")
        print("Start it with:  python ml_service.py")
        sys.exit(1)
    print(f"ML service OK ({args.ml_url})")

    if args.probe:
        run_probe(args.ml_url, openai_client=openai_client)
        return

    if not os.path.exists(args.csv):
        print(f"ERROR: CSV not found: {args.csv}")
        sys.exit(1)

    run_batch(
        csv_path      = args.csv,
        base_dir      = args.base_dir,
        media_type    = args.type,
        limit         = args.limit,
        col_path      = args.col_path,
        col_label     = args.col_label,
        ml_url        = args.ml_url,
        openai_client = openai_client,
    )


if __name__ == "__main__":
    main()
