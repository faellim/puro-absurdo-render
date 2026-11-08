#!/usr/bin/env python3
"""Original comedic score, SFX stems, speech ducking and deterministic 48k mix.

No samples or copyrighted recordings: synthetic sound from numpy waveforms.
The cue table is tied to audio-measured scene boundaries, not estimates.
"""
import json
import sys
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 48000
rng = np.random.default_rng(1932)

def stereo_wav(path, x):
    clipped = np.clip(x, -0.999, 0.999)
    pcm = (clipped.T * 32767).astype("<i2").tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm)

def mono_read(path):
    with wave.open(str(path), "rb") as w:
        if (w.getnchannels(), w.getsampwidth(), w.getframerate()) != (1, 2, SR):
            raise ValueError("Speech must be PCM 48k mono")
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768.0

def place(track, start, wave, gain=1, pan=0):
    i=int(start*SR); n=max(0,min(wave.size,len(track[0])-i))
    if n<=0:return
    if i<0:
        wave=wave[-i:];n=min(len(wave),len(track[0]));i=0
    # Pan: equal-power constant energy with centered tracks.
    a=np.cos((pan+1)*np.pi/4); b=np.sin((pan+1)*np.pi/4)
    track[0,i:i+n]+=wave[:n]*gain*a
    track[1,i:i+n]+=wave[:n]*gain*b

def tone(freq, duration, color=1.0):
    t=np.arange(max(1,round(duration*SR)),dtype=np.float32)/SR
    env=np.power(np.maximum(0,1-t/duration),2.7)*np.minimum(1,t/.012)
    wave=(np.sin(2*np.pi*freq*t)+.38*np.sin(2*np.pi*freq*2*t)+.12*np.sin(2*np.pi*freq*3*t))
    return (wave*env*color).astype(np.float32)

def noise(duration, low=1.0):
    n=max(1,int(duration*SR))
    x=rng.normal(0,1,n).astype(np.float32)
    if low>1:
        kernel=np.ones(int(low),dtype=np.float32)/int(low)
        x=np.convolve(x,kernel,mode="same")
    env=np.sin(np.linspace(0,np.pi,n,dtype=np.float32))**2
    return x*env

def effect(kind):
    if kind=="swoosh": return noise(.36,36)*.8
    if kind=="peep": return tone(970,.25)+np.pad(tone(1140,.13)*.4,(2000,12000-2000-len(tone(1140,.13))))
    if kind=="step": return noise(.14,17)*.75
    if kind=="jam": return tone(315,.10)*.7+np.pad(tone(600,.15)*.4,(1500,0))[:4800]
    if kind=="hit": return tone(90,.38)*.7+noise(.38,28)*.1
    if kind=="engine":
        dur=.84;t=np.arange(int(dur*SR),dtype=np.float32)/SR
        return (.6*np.sin(2*np.pi*(58+35*t)*t)+.2*np.sin(2*np.pi*180*t))*(np.sin(np.pi*t/dur)**1.1)
    if kind=="wobble":
        dur=.53;t=np.arange(int(dur*SR),dtype=np.float32)/SR
        return (.5*np.sin(2*np.pi*(340-170*t/dur)*t))*(np.sin(np.pi*t/dur)**2)
    if kind=="chirp": return tone(710,.18)*.6
    if kind=="click": return noise(.10,3)*.65
    if kind=="cymbal": return noise(.43,3)*.45
    if kind=="emu":
        dur=.48;t=np.arange(int(dur*SR),dtype=np.float32)/SR
        f=260+195*np.sin(np.pi*t/dur)**2
        phase=2*np.pi*np.cumsum(f)/SR
        env=np.minimum(1,t/.025)*np.maximum(0,1-t/dur)**1.5
        return (np.sin(phase)+.35*np.sin(phase*2.04)+.15*np.sin(phase*3.1))*env*.67
    if kind=="rattle":
        dur=.53;t=np.arange(int(dur*SR),dtype=np.float32)/SR
        pulse=(np.sin(t*2*np.pi*21)>.75).astype(np.float32)
        return (noise(dur,4)*.6+np.sin(2*np.pi*125*t)*.4)*pulse*np.sin(np.pi*t/dur)
    if kind=="paper":
        return noise(.40,6)*.28
    if kind=="wheat":
        return noise(.66,70)*.33
    raise ValueError("Unknown SFX "+kind)

def main(slug):
    base=ROOT/"episodes"/slug
    out=ROOT/"out"/slug
    timing=json.loads((base/"timing.json").read_text("utf-8"))
    spec=json.loads((base/"episode.json").read_text("utf-8"))
    frames=int(timing["frames"])
    N=frames*SR//30
    voice=mono_read(out/"voice.wav")
    if len(voice)!=N:raise ValueError(f"Audio duration {len(voice)} != scene frames {N}")
    speech=np.vstack([voice,voice])
    music=np.zeros((2,N),np.float32)
    fx=np.zeros((2,N),np.float32)
    duration=N/SR
    words=timing["words"]
    if not words:raise ValueError("No word synchronization markers")
    # Whole soundtrack is an original comic march in D minor, at 112 bpm.
    beat=60/112
    melody=[74,77,81,77,76,74,72,69,74,79,77,74,72,69,67,69]
    low=[50,53,55,48]
    for j,t in enumerate(np.arange(0,duration,beat)):
        midi=melody[j%len(melody)]
        hz=440*2**((midi-69)/12)
        place(music,float(t),tone(hz,.31)*.12,1.0,pan=(-.16 if j%2 else .15))
        if j%2==0:
            b=low[(j//4)%len(low)]
            place(music,float(t),tone(440*2**((b-69)/12),.45)*.18,1,-.28)
        if j%4==0:
            place(music,float(t),tone(70,.24)*.22,1,-.4)
        if j%4==2:
            place(music,float(t),noise(.15,8)*.032,1,.25)
        if j%2==1:
            place(music,float(t),noise(.065,10)*.008,1,.05)
    # Counterscore: sparse low string-like harmony on the off-beat.
    # All tones are synthesized from scratch and are independent of samples.
    for j,t in enumerate(np.arange(0,duration,beat*2)):
        base=low[(j//2)%len(low)]
        hz=440*2**((base+12-69)/12)
        wave=tone(hz,.78)*.05
        place(music,float(t+.16),wave,1,pan=.18)
    # Farm ambience and musical swells follow the actual narration-locked cuts.
    for shot in timing["shots"]:
        beg=shot["start"]/30
        end=shot["end"]/30
        if shot["id"] in ("setting","scatter","zigzag","result"):
            for t in np.arange(beg+.3,end-.2,1.4):
                place(music,float(t),noise(.9,60)*.015,1,pan=-.35)
    # Natural ambience is a distant, light breeze, always below the music.
    ambience=rng.normal(0,1,N).astype(np.float32)
    smooth=np.interp(np.arange(N,dtype=np.float32)/SR,
                     np.arange(0,duration+1,.22),
                     rng.normal(0,1,len(np.arange(0,duration+1,.22)))).astype(np.float32)
    music += np.vstack([smooth,smooth])*.004
    cues=[]
    catalogue={
       "hook":[(.20,"cymbal",.65),(.95,"emu",.55)],
       "setting":[(.2,"wheat",.45),(1.7,"step",.45),(2.1,"step",.4)],
       "farmers":[(.35,"step",.5),(1.25,"click",.4),(2.3,"cymbal",.4)],
       "plan":[(.5,"click",.75),(1.5,"peep",.3)],
       "scatter":[(.1,"swoosh",.55),(.7,"step",.65),(1.15,"emu",.46),(1.6,"swoosh",.65)],
       "ambush":[(.7,"emu",.52),(1.3,"step",.35)],
       "jam":[(.9,"jam",.95),(1.65,"wobble",.65)],
       "truck":[(.15,"engine",.9),(1.3,"rattle",.5)],
       "bumps":[(.5,"hit",.7),(1.15,"rattle",.65),(2.1,"wobble",.8)],
       "zigzag":[(.3,"swoosh",.8),(.75,"step",.55),(1.8,"swoosh",.6)],
       "press":[(.4,"paper",.55),(1.2,"wobble",.45)],
       "result":[(.2,"chirp",.4),(1.5,"swoosh",.25)],
       "ending":[(.3,"emu",.50),(1.1,"cymbal",.4)]
    }
    for shot in timing["shots"]:
        origin=shot["start"]/30
        end=shot["end"]/30
        for rel,kind,volume in catalogue.get(shot["id"],[]):
            at=origin+rel
            if at>=end:continue
            place(fx,at,effect(kind).astype(np.float32),volume,pan=float(rng.uniform(-.45,.45)))
            cues.append({"t":round(at,3),"scene":shot["id"],"type":kind,"gain":volume})
    # Speech-aware volume shaping at a control rate of 100 Hz.
    ctrl=100
    nctl=int(duration*ctrl)+2
    target=np.ones(nctl,np.float32)*.82
    for word in words:
        a=max(0,int((float(word["s"])-.10)*ctrl))
        b=min(nctl,int((float(word["e"])+.17)*ctrl))
        target[a:b]=.43
    # Stable linear ramps reduce clicks in dynamic beds.
    coef=1-np.exp(-1/(.12*ctrl))
    smoothed=np.empty_like(target);prev=.43
    for i,value in enumerate(target):
        prev+=(value-prev)*coef
        smoothed[i]=prev
    envelope=np.interp(np.arange(N,dtype=np.float32)/SR,np.arange(nctl)/ctrl,smoothed).astype(np.float32)
    music*=envelope[None,:]
    # Make a real level ratio to voice (not arbitrary signal amplitudes).
    active=voice[np.abs(voice)>.008]
    voice_rms=np.sqrt(np.mean(active.astype(np.float64)**2)) if len(active) else .11
    music_rms=np.sqrt(np.mean(music.astype(np.float64)**2))
    fx_rms=np.sqrt(np.mean(fx.astype(np.float64)**2))
    if music_rms:music*=float(voice_rms*.18/music_rms)
    if fx_rms:fx*=float(voice_rms*.10/fx_rms)
    mixture=speech*.86+music+fx
    peak=float(np.max(np.abs(mixture)))
    if peak>.9:
        scale=.9/peak
        speech*=scale;music*=scale;fx*=scale;mixture*=scale
    out.mkdir(parents=True,exist_ok=True)
    stereo_wav(out/"stem_voice.wav",speech*.86)
    stereo_wav(out/"stem_music.wav",music)
    stereo_wav(out/"stem_sfx.wav",fx)
    stereo_wav(out/"mix.wav",mixture)
    (out/"cues.json").write_text(json.dumps(cues,indent=2),encoding="utf-8")
    report={"duration_s":round(duration,3),"frames":frames,"words":len(words),
            "cue_count":len(cues),"peak":round(float(np.max(np.abs(mixture))),4),
            "voice_active_rms":round(float(voice_rms),4),
            "music_rms":round(float(np.sqrt(np.mean(music.astype(np.float64)**2))),4)}
    (out/"audio_report.json").write_text(json.dumps(report,indent=2))
    print("MIX_READY",json.dumps(report))

if __name__=="__main__":
    main(sys.argv[1] if len(sys.argv)>1 else "emu-1932")
