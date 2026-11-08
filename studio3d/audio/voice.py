#!/usr/bin/env python3
"""Produce original pt-BR narration with native Edge-TTS WordBoundary offsets.

Prefer native word-boundary events; if absent, align against actual synthesized
speech using a CPU ASR model. Report the alignment method per word.
Each shot is rounded to a 30 fps boundary.
"""
import asyncio
import json
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import edge_tts

HERE = Path(__file__).resolve().parents[1]
FPS = 30
SR = 48000
PER_FRAME = SR // FPS
ONE_SEC = 10_000_000
VOICE_TEMPO = 1.58  # native narration is too slow for short-form history pacing

def write_pcm(file: Path, pcm: bytes):
    file.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(file), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm)

def pcm_from_mp3(mp3: Path, raw: Path):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(mp3), "-filter:a", f"atempo={VOICE_TEMPO}", "-ac", "1", "-ar", str(SR),
                    "-f", "s16le", str(raw)], check=True)
    return raw.read_bytes()

async def one_shot(text, voice, dest):
    last_error = None
    for attempt in range(3):
        chunks = []
        words = []
        try:
            connection = edge_tts.Communicate(text, voice, rate="+10%")
            async for item in connection.stream():
                if item["type"] == "audio":
                    chunks.append(item["data"])
                elif item["type"] == "WordBoundary":
                    words.append({
                        "word": item["text"],
                        "offset": int(item["offset"]),
                        "duration": int(item["duration"])
                    })
            if not chunks:
                raise RuntimeError("Voice provider returned zero audio chunks")
            dest.write_bytes(b"".join(chunks))
            return words
        except Exception as exc:
            last_error = exc
            await asyncio.sleep((attempt + 1) * 1.2)
    print("Edge TTS failed, trying Google TTS fallback:", last_error, flush=True)
    try:
        from gtts import gTTS
        gTTS(text, lang="pt", tld="com.br").save(str(dest))
        return []
    except Exception as second:
        raise RuntimeError(f"Voice unavailable from either TTS provider: {last_error}; {second}")


ASR_MODEL = None

def align_from_audio(audio: bytes, audio_path: Path):
    """Audio-grounded ASR timestamp alignment. Not invented uniform word spacing."""
    global ASR_MODEL
    if ASR_MODEL is None:
        from faster_whisper import WhisperModel
        print("Loading Whisper tiny CPU for real speech alignment", flush=True)
        try:
            ASR_MODEL = WhisperModel("small", device="cpu", compute_type="int8", num_workers=4)
        except Exception as exc:
            print("Whisper small not available, falling back to base:", exc, flush=True)
            ASR_MODEL = WhisperModel("base", device="cpu", compute_type="int8", num_workers=4)
    # Passing PCM as an ndarray bypasses PyAV decode compatibility issues.
    import numpy as np
    pcm = np.frombuffer(audio, dtype="<i2").astype(np.float32) / 32768.0
    pcm16 = pcm[::3].copy()  # our input is always 48000 Hz; Whisper expects 16000
    segments, info = ASR_MODEL.transcribe(pcm16, language="pt",
                                         word_timestamps=True, beam_size=1,
                                         vad_filter=False, condition_on_previous_text=False)
    boundaries = []
    for segment in segments:
        for word in segment.words or []:
            start = max(0, float(word.start))
            length = max(.01, float(word.end) - start)
            boundaries.append({
                "word": word.word.strip(),
                "offset": round(start * ONE_SEC),
                "duration": round(length * ONE_SEC),
            })
    if len(boundaries) < 3:
        raise RuntimeError("Cannot audio-align this segment, no usable ASR word boundaries")
    print("ASR word timings", len(boundaries), flush=True)
    return boundaries

async def main(slug):
    base = HERE / "episodes" / slug
    spec = json.loads((base / "episode.json").read_text("utf-8"))
    voice = spec.get("voice", "pt-BR-AntonioNeural")
    total = bytearray()
    shots = []
    all_words = []
    with tempfile.TemporaryDirectory() as temp:
        tmp = Path(temp)
        for i, shot in enumerate(spec["shots"]):
            print("Speech", i + 1, shot["id"], flush=True)
            source = tmp / f"part_{i}.mp3"
            boundaries = await one_shot(shot["text"], voice, source)
            # Speed-adjust native offsets; fallback ASR below hears already sped-up PCM.
            boundaries = [{**w, "offset": round(w["offset"] / VOICE_TEMPO),
                           "duration": round(w["duration"] / VOICE_TEMPO)} for w in boundaries]
            audio = pcm_from_mp3(source, tmp / f"part_{i}.raw")
            alignment = "edge-word-boundary"
            if not boundaries:
                boundaries = align_from_audio(audio, tmp / f"part_{i}.wav")
                alignment = "faster-whisper-audio"
            if len(audio) < SR or len(audio) % 2:
                raise ValueError("Invalid speech segment " + shot["id"])
            start = len(total) // 2 // PER_FRAME
            # 0.16 s of punctuation room per sentence. Clamp to video frame boundary.
            audio += bytes(round(.16 * SR) * 2)
            pad = (-len(audio) // 2) % PER_FRAME
            audio += bytes(pad * 2)
            end = start + len(audio) // 2 // PER_FRAME
            max_t = end / FPS
            total.extend(audio)
            shots.append({"id": shot["id"], "start": start, "end": end})
            for item in boundaries:
                begin = start / FPS + item["offset"] / ONE_SEC
                finish = begin + item["duration"] / ONE_SEC
                if begin < start/FPS - 0.01 or begin >= max_t:
                    raise ValueError("Invalid word timing for " + item["word"])
                all_words.append({
                    "text": item["word"],
                    "shot": shot["id"],
                    "alignment": alignment,
                    "s": round(begin, 4),
                    "e": round(min(max_t, finish), 4),
                    "frame": max(start, min(end - 1, round(begin * FPS)))
                })
        out = HERE / "out" / slug
        out.mkdir(parents=True, exist_ok=True)
        wav = out / "voice.wav"
        write_pcm(wav, bytes(total))
        frame_count = len(total) // 2 // PER_FRAME
        if frame_count != shots[-1]["end"] or not all_words:
            raise ValueError("Audio/story frame mismatch")
        timing = {"fps": FPS, "frames": frame_count, "shots": shots, "words": all_words, "alignment": sorted(set(w["alignment"] for w in all_words))}
        (base / "timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (out / "words.json").write_text(json.dumps(all_words, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("VOICE_READY", json.dumps({"frames":frame_count,"seconds":round(frame_count/FPS,2),"words":len(all_words),"shots":len(shots)}))

if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "emu-1932"
    if not slug.replace("-", "").isalnum() or ".." in slug:
        raise ValueError("Unsafe episode slug")
    asyncio.run(main(slug))
