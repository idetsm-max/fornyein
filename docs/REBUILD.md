# ForNyein — rebuild plan (v2 editor)

Status: PLAN. Decided with the user (Nov 2026): the old UI/code is dropped; ForNyein is rebuilt from scratch to match the design
mockup `VidPro_Cinematic_Video_Editor_Mockup.png` (CapCut-like editor). Behaviour = CapCut (clip/track model); look = the mockup.
Keep this file up to date: chat memory is not available, so this is the hand-over document.

## 1. What the mockup shows (measured on the 1672 x 941 image)

| region | box (x, y, w, h) | content |
|---|---|---|
| top bar | 0, 0, 1672, 67 | logo + name · Home · "My Projects ▾" · cloud "Auto Saved 2 min ago" · undo / redo · zoom "100% ▾" · fullscreen · [Preview] · [Export] (blue) · theme toggle (sun/moon) · avatar |
| tool rail | 0, 67, 90, ~810 | vertical icon+label buttons: Media, Audio, Text, Stickers, Effects, Transitions, Filters, Adjust, Templates, More. Active = filled dark-blue tile |
| left panel | 90, 67, 438, ~500 | tabs (Local / Stock / Audio / Record, blue underline) · "Upload Media ▾" · filter chips (All, Videos, Photos, Audio) + grid toggle · media thumbnails grid (3 columns, duration badge, selected = blue border) · "+ Add More" tile |
| player | 528, 67, 775, ~500 | preview canvas (16:9 letterboxed in a rounded dark frame); floating toolbar over the selected text (T, frame, duplicate, delete, ...); selection box with 8 handles; below: timecode "00:00:12:15 / 00:00:30:00", prev, play, next, "16:9 ▾", fullscreen, fit |
| inspector (right, top) | 1305, 67, 367, ~500 | tabs (Text / Animation / Tracking / Text to Speech) · text box with counter · Font select · Style (B I U + 4 alignments) · Color swatch + eyedropper · Size slider+number · Opacity slider+% · Position X / Y · Rotate slider + degrees + reset |
| effects (right, bottom) | 1305, 567, 367, ~310 | tabs (Effects / Transitions / Filters) · category chips (Trending, Basic, Retro, B&W, Blur) · 4-column thumbnail grid with names |
| timeline | 90, 567, 1215, ~311 | tool row (undo, redo, | cut, delete, crop, split, speed, audio, ...) · ruler 00:00 ... 00:30 · track headers with eye + lock + icon + name (Text, Video, Overlay, Audio) · clips: Text = purple bar with label; Video = thumbnail strip; Overlay = sticker clip; Audio = green waveform with file name · orange-red playhead with head · horizontal scrollbar |
| status bar | 0, 878, 1672, 63 | "Project: Untitled Project | Resolution: 1920 x 1080 (16:9)" · [Save Project] · [Export Video] (blue) |

Sampled colours: top bar / panels `#131c1d`..`#1b1e26` (cool dark grey-blue), timeline `#14171d`, page frame `#10131b`, inputs/selects `#2a2e3a`,
accent blue `#2b85fd` (buttons, active tab underline, slider, chips), selected thumbnail border `#3d70af`, active rail tile `#0f396d`,
text clip purple `#6553ca`, video clip `#124164`, audio waveform green `#8ecabe`, playhead `#f76850`, status bar `#1c1f27`.
Typography: Inter-like UI sans; Myanmar text must use "Noto Sans Myanmar" / R2 fonts.

## 2. Tech decisions
* No build step (Cloudflare Workers static assets serve `public/`). Native ES modules.
* UI = Preact + htm (pinned versions from jsDelivr), one small store (subscribe/dispatch) + immutable project JSON; icons = inline SVG.
* Canvas 2D renderer (same `drawFrame(t)` for preview and export), Web Audio graph (same builder for preview and offline export), Mediabunny for MP4.
* New app lives in `public/v2/` until it replaces `/app`; the old code moves to `public/legacy/` and is deleted when v2 is complete.
* Worker (`worker/src/index.ts`) stays: R2 library (`/api/library`, `/api/asset`), Access JWT check, `/api/transcribe` (ASR, parked).

## 3. Project model (JSON v3): tracks -> clips
```
project = { id, name, version:3, size:{w,h}, fps, tracks:[ track ], markers:[], style:{...global text defaults}, library:{} }
track   = { id, kind:'text'|'video'|'overlay'|'audio'|'music'|'sfx', name, hidden, locked, muted, clips:[ clip ] }
clip    = { id, kind, start, dur, in (source offset), src:{ type:'local'|'r2', key|name }, ... kind specific:
            text:  { text, style:{font,size,fill,fill2,k,stroke,strokeOn,...}, anim:{in,out,loop}, pos:{x,y,rot,scale}, effects:[] }
            audio: { gain, fade:{in,out}, fx:{...}, loop }  video: { fit:'cover|contain', speed, filters:{} } }
```
Everything is a clip: split / trim / move / delete / ripple / snap / multi-select behave the same for every kind.
Undo/redo = history of project snapshots. Autosave = IndexedDB; a new session starts empty, "My Projects" lists saved projects.

## 4. Old feature -> new place (nothing is dropped without a decision)
Myanmar syllable splitter, Zawgyi->Unicode, Intl.Segmenter wrapping -> `lib/myanmar.js` · poem paste -> captions panel (Text tool) ·
Tap-sync, Auto-draft (VAD), review/lock -> timeline tools on text clips · text effects (15) + animations + presets -> Text inspector (Text / Animation tabs) ·
two-colour text, stroke on/off per clip -> Text inspector · fonts (system + R2 `Fonts/` + local file) -> Font select ·
R2 library tiles + own files -> Media / Audio panels · voice recording -> Record tab · audio mixer (EQ, comp, reverb, echo, ducking, SE, limiter) -> Audio inspector ·
credits / title card -> Templates / Text presets · BG photo/video + logo -> video / overlay tracks · SRT export -> Export dialog ·
project autosave + "last project" -> My Projects.

## 5. Phases (each phase is pushed, deployed and checked by the user before the next)
0. Shell: layout + design tokens from the mockup, theme toggle, status bar, responsive resize, empty states. (static, no engine)
1. Engine core: store, project model, undo/redo, autosave, renderer (`drawFrame`), transport (play/pause/seek), audio clock.
2. Timeline: tracks with eye/lock, clips, ruler, zoom/scroll, playhead, snapping, select / move / trim / split / delete / ripple, waveform + thumbnails.
3. Media + Audio panels: upload, R2 library, drag clips onto the timeline, Record.
4. Text: text clips + inspector (font, style, colours, stroke, animation, position/rotate on canvas), poem workflow (paste, split, Tap-sync).
5. Audio inspector + mixer, effects / filters / adjust (basic), templates.
6. Export (Mediabunny) + SRT + project manager + keyboard shortcuts + import of old project JSON.
7. Auto caption (ASR) — see below.

## 6. Open decisions
* UI language of labels (mockup is English; user's audience is Burmese).
* Which rail tools are really needed for poem videos (Stickers? Transitions?).
* ASR: Workers AI Whisper (`@cf/openai/whisper-large-v3-turbo`) was tried on Burmese audio and returned text in other scripts (Georgian/Cyrillic) — unusable.
  Options left: Burmese fine-tuned Whisper on the user's own PC (`local-asr/`, free) or a paid API. Parked until the rebuild is done.

## 7. Constraints to remember
* The assistant cannot run the app: every change is verified from the user's screenshots / console errors. Keep modules small and defensive.
* GitHub connector cannot upload binary files (fonts, images). Licensed fonts stay in the private R2 bucket `Fonts/`, never in the public repo.
* Cloudflare Access is not enabled yet (AUD tag pending); `/api/*` is public until then.
