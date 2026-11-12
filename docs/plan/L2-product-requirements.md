# Plan — Layer 2: Product Requirements (ဘာကို၊ ဘယ်သူ့အတွက်၊ ဘယ်လောက်ကောင်းရမလဲ)

Layer 1 (`Plan.md`) က "ဘယ်အစီအစဉ်နဲ့ ဆောက်မလဲ" ဖြစ်ပြီး ဒီ Layer 2 က **"အဆင့်တိုင်းမှာ ဘာဖြစ်ရမလဲ" ကို တိုင်းတာလို့ရအောင်** ရေးတာပါ။
**ယူဆချက်များ (Assumption)** ကို `[A]` နဲ့ မှတ် — သင်အတည်ပြု/ပြင်မှ အတည်ဖြစ်။ ပြင်ရင် ဒီဖိုင်ကို ပြင်ပြီး §၉ ဆုံးဖြတ်ချက်မှတ်တမ်းထဲ မှတ်။

---

## ၁။ အသုံးပြုသူ (Persona) နဲ့ အခြေအနေများ

### ၁.၁ ပင်မ Persona `[A]`
**"ကဗျာဖတ်သူ/ရေးသူ"** — တစ်ဦးတည်း လုပ်သူ၊ Windows laptop (Chrome/Edge)၊ ဗီဒီယိုတည်းဖြတ်ရာ ကျွမ်းကျင်သူ မဟုတ်၊ ဖတ်သံကို ကိုယ်တိုင်သွင်း သို့ ရှိပြီးသား audio သုံး၊ **YouTube (16:9)** နဲ့ **Facebook Reels / TikTok (9:16)** မှာ တင်၊ ကဗျာတစ်စုကို **ပုံစံတူအောင်** ထုတ်ချင်၊ မြန်မာစာ **မပျက်** ဖို့ အရေးအကြီးဆုံး။
**မဟုတ်သူ (Non-goals)**: ပရော်ဖက်ရှင်နယ် colorist၊ ၄K/HDR၊ ဖုန်း app၊ အဖွဲ့လိုက်တည်းဖြတ် (collaboration)၊ cloud render။

### ၁.၂ အဓိက အခြေအနေ (Scenarios)
| ID | အခြေအနေ | ရလဒ် |
|---|---|---|
| SC1 | App ထဲမှာ ဖတ်သံသွင်း → ကဗျာ paste → စာတန်းချိန်ကိုက် → style → MP4 | အသံပါ ၁၆:၉ ဗီဒီယို |
| SC2 | ရှိပြီးသား audio ဖိုင် + ကဗျာစာသား | SC1 နဲ့တူ |
| SC3 | ကဗျာတစ်စု (၅–၁၀ ပုဒ်) ကို template တူညီစွာ | Project duplicate + စာသား/ဖတ်သံသာလဲ |
| SC4 | ၉:၁၆ Reels (စာတန်းနေရာ safe-area ကိုက်) | ၁၀၈၀×၁၉၂၀ MP4 |
| SC5 | နောက်ခံ ပုံ/ဗီဒီယို + Music (ဖတ်သံအောက် ချပေး) | သန့်ရှင်းတဲ့ mix |
| SC6 | SRT ဖိုင်ပဲ လိုချင် (ဗီဒီယို မထုတ်) | မြန်မာစာမှန် SRT |
| SC7 | ပြီးခဲ့တဲ့ project ကို ပြန်ဖွင့်ပြင် (media ပါ ပြန်ပေါ်) | ပျောက်ဆုံးမှု မရှိ |

---

## ၂။ အောင်မြင်မှု တိုင်းတာချက် (Success metrics)

| Metric | ပစ်မှတ် | တိုင်းနည်း |
|---|---|---|
| **TTFV** (ပထမဗီဒီယို ထွက်ချိန်၊ ၁ မိနစ်ကဗျာ၊ ပထမအသုံးပြု) | ≤ ၁၅ မိနစ် | သင့်ကိုယ်တိုင် stopwatch (Poem Mode စစ်ချိန်) |
| စာတန်းချိန်ကိုက်မှု (Auto-draft + Review ပြီး) | median ≤ ၁၂၀ ms၊ 95th ≤ ၂၅၀ ms | ground-truth ကဗျာ ၃ ပုဒ် (လက်နဲ့မှတ်ထားသောအချိန်) နှိုင်း |
| **မြန်မာစာ မပျက်မှု** | **၁၀၀%** (invariant) | corpus စစ် (§၆) — Unicode မှန်ကို ဘာမှမပြောင်း |
| Export အောင်မြင်မှု (crash/error မပါ) | ≥ ၉၉% (စမ်းသပ် ၂၀ ကြိမ်) | e2e + သင့်စက် |
| Export ရဲ့ A/V drift | ≤ ၄၀ ms | ffprobe |
| Preview မှာ ကြားရ/မြင်ရတာ = Export | တူ (spectrum ≤ ၃ dB၊ frame hash) | golden test |
| Undo လုပ်နိုင်မှု | edit action ၁၀၀% | action စာရင်းနဲ့ test |
| Preview fps (ကဗျာ ၅ မိနစ်) | ≥ ၃၀ | Perf HUD |
| Project ဖွင့်ချိန် | ≤ ၃ s | stopwatch |
| Session crash-free | ≥ ၉၉% | error banner မှတ်တမ်း (အတွင်းမှာပဲ) |

---

## ၃။ Poem Mode — အဓိက အသုံးပြုပုံ (User journey)

Editor ထဲမှာပဲ **"Poem" guided panel** (ဘယ် rail ရဲ့ ထိပ်၊ ဖွင့်/ပိတ်လို့ရ) — အဆင့် ၇ ခု၊ တစ်ဆင့်ပြီးတိုင်း ✓ ပြ၊ ကျော်လို့ရ၊ ပြန်လာလို့ရ။ ဘယ်အဆင့်မှာမှ editor ကို မပိတ်ဆို့။

| # | အဆင့် | အသုံးပြုသူ လုပ်ရန် | App လုပ်ပေး/စစ်ပေးရန် | မအောင်ရင် |
|---|---|---|---|---|
| 1 | **ဖတ်သံ** | Record သို့ Import | decode၊ waveform၊ **အသံကျယ်/ကျိတ်/တိတ်/ဆူညံ စစ်** (clipping, အရမ်းတိတ်) | "အသံ ဖတ်မရ — ဖိုင်ပုံစံ (mp3/wav/m4a/ogg) စစ်ပါ"၊ mic ခွင့်ပြုချက်ငြင်းရင် ဖိုင်တင်လမ်းပြ |
| 2 | **ကဗျာစာသား** | paste/ရိုက် | **Zawgyi ထောက်လှမ်း** → confirm ပြီးပြောင်း (မမေးဘဲ မပြောင်း)၊ စာကြောင်း/စာပိုဒ်ခွဲ (blank line = ပိုဒ်ခြား)၊ အရေအတွက်ပြ | စာသားအလွတ်/ရှည်လွန်း အသိပေး |
| 3 | **အချိန်ကိုက်** | Auto-draft နှိပ် → အနီ/ဝါ စာကြောင်းတွေ ပြန်စစ် → လိုရင် Tap-sync | VAD နဲ့ ခွဲ၊ confidence အရောင်၊ "Review next (R)"၊ Lock (L) | pause မထင်ရှားရင် "ဖတ်သံထဲ pause နည်း — Tap-sync သုံးပါ" |
| 4 | **ပုံစံ** | Template ရွေး၊ font၊ အရွယ်၊ (လိုရင်) စာကြောင်းတစ်ခု သီးသန့်ပြင် | **Apply to all**၊ ၉:၁၆ safe-area guide၊ စာမကွဲ/မကျော်စစ် (overflow warning) | font မဖွင့်ရင် fallback နဲ့ သတိပေး |
| 5 | **ပုံ/နောက်ခံ** | ပုံ/ဗီဒီယို ရွေး၊ Title card (ကဗျာနာမည်/ရေးသူ/ဖတ်သူ)၊ Credits | fit/ချဲ့ (Ken Burns option)၊ ဖတ်သံကြာချိန်နဲ့ background ကြာချိန် ကိုက်ပေး | media ဖတ်မရ/ကြီးလွန်း အသိပေး |
| 6 | **Music/အသံ** | Music ရွေး (R2 သို့ ကိုယ့်ဖိုင်) | **Ducking အလိုအလျောက် (ဖတ်သံအောက် −၁၂ dB)**၊ fade in/out၊ loudness ကိုက်ညှိ | ဖတ်သံထက်ကျယ်ရင် သတိပေး |
| 7 | **စစ်ပြီး ထုတ်** | Preview အစကနေအဆုံး၊ Export | **Pre-export checklist** (စာတန်း lock/review ကျန်၊ စာမကျော်၊ အသံ clipping၊ ကြာချိန်)၊ preset (YouTube 1080p၊ Reels 9:16၊ 720p အသေး)၊ SRT ပါ | codec မရရင် WebM/Opus လမ်းပြ၊ cancel ရ |

**Poem Mode ရဲ့ စည်းမျဉ်း**: (က) အဆင့်တိုင်း ပြန်ပြင်လို့ရ (non-linear)၊ (ခ) အဆင့်တိုင်းရဲ့ ရလဒ်က **ပုံမှန် clip/track** တွေပဲ — Poem Mode မပါဘဲ အပြည့်အဝ editor နဲ့ ပြင်လို့ရ၊ (ဂ) AI/auto တစ်ခုခုလုပ်ရင် **ရလဒ်ကို "draft" လို့ ပြပြီး အတည်ပြုခိုင်း** (လက်မခံမချင်း မလော့ခ်)။

---

## ၄။ Functional Requirements (FR) — Priority: **P0** = Release မတိုင်ခင် မဖြစ်မနေ၊ **P1** = သင့်တော်စွာ လိုအပ်၊ **P2** = ကောင်းတယ်

### Project / Storage
- FR-PRJ-01 **P0** Project ကို autosave (အပြောင်းအလဲ ပြီး ≤ ၁ s)၊ reload လုပ်လည်း မပျောက်။
- FR-PRJ-02 **P0** Media ဖိုင်ကို IndexedDB ထဲ သိမ်း (project နဲ့တွဲ)၊ ပြန်ဖွင့်ရင် ပြန်ရွေးစရာမလို။
- FR-PRJ-03 **P0** Project JSON export/import (အခြားစက်သို့)၊ schema version + `migrate()`။
- FR-PRJ-04 P1 My Projects: rename / duplicate / delete / ပြင်ဆင်ချိန်စီ။
- FR-PRJ-05 P1 Storage quota နီးရင် အသိပေး၊ `storage.persist()` တောင်း။
- FR-PRJ-06 P2 Crash recovery (နောက်ဆုံး autosave ကနေ ပြန်ဖွင့်ရန် banner)။

### Media / Audio
- FR-MED-01 **P0** Audio (mp3/wav/m4a/ogg/webm) import၊ decode မအောင်ရင် အကြောင်းရင်းပြ။
- FR-MED-02 P0 Waveform (zoom အလိုက် ပြတ်သားမှု)။
- FR-MED-03 P1 Video/Photo import (thumbnail)။
- FR-MED-04 P1 Mic recording (ခွင့်ပြုချက်၊ level meter၊ countdown)။
- FR-AUD-01 **P0** Audio clip: gain၊ fade in/out၊ mute/solo၊ loop (Music)။
- FR-AUD-02 **P0** **Split/trim မှာ အသံ မရွေ့မပြန်စ** (`src.in` မှန်)။
- FR-AUD-03 P0 Ducking (ဖတ်သံပေါ် Music ချ)၊ limiter (clipping မဖြစ်)။
- FR-AUD-04 P1 EQ/Compressor/Reverb/Echo — **Preview နဲ့ Export တူ**။
- FR-AUD-05 P2 Loudness normalize (ဖတ်သံ −၁၆ LUFS ပစ်မှတ်)။

### Text / Poem
- FR-TXT-01 **P0** **Unicode မြန်မာစာကို မပြောင်းမလဲ** (paste/split/render/export/SRT အားလုံး)။
- FR-TXT-02 P0 Zawgyi ထောက်လှမ်း → confirm → Unicode ပြောင်း (ခလုတ်လည်းရ)။
- FR-TXT-03 **P0** ကဗျာ paste → စာကြောင်း/ပိုဒ် clip များ၊ Auto-draft (VAD)၊ Tap-sync၊ Review/Lock။
- FR-TXT-04 P0 Font (system + R2 Fonts/ + ကိုယ်ပိုင်ဖိုင်)၊ မရှိတဲ့ font အတွက် fallback + သတိပေး။
- FR-TXT-05 P0 Style: အရောင် (နှစ်မျိုး)၊ stroke on/off၊ shadow/glow၊ size၊ opacity၊ position၊ rotate။
- FR-TXT-06 P1 Animation In/Out/Loop၊ Typewriter/Word reveal (syllable-aware)၊ effect ၁၅ ခု (မြန်မာမှာ စမ်းပြီးသာ ဖွင့်)။
- FR-TXT-07 P1 Template/Preset + **Apply to all**၊ ကိုယ်ပိုင် preset သိမ်း။
- FR-TXT-08 P1 SRT export (UTF-8 **BOM** ပါ)၊ SRT import။
- FR-TXT-09 P1 Title card / Credits template။
- FR-TXT-10 P2 Word/syllable အဆင့် timing (Karaoke)။

### Timeline (Plan §5 အပြည့်အစုံ)
- FR-TML-01 **P0** Clip ရွေး/ရွှေ့/trim/split/delete/ripple-delete/duplicate — **Ctrl+Z တိုင်း ပြန်ရ**။
- FR-TML-02 **P0** တစ်ခု lane မှာ clip မထပ် (auto lane)။
- FR-TML-03 P0 Snap (playhead/clip/marker/voice phrase)၊ Shift=ပိတ်။
- FR-TML-04 P0 Zoom/scroll/Fit၊ ပုံမှန် ၆၀ px/s၊ playhead လိုက်။
- FR-TML-05 P1 Multi-select/box select၊ link group၊ marker၊ In/Out range cut။
- FR-TML-06 P1 Ripple/roll/slip/slide trim၊ Insert vs Overwrite၊ main-track magnet။
- FR-TML-07 P1 Audio scrubbing၊ J/K/L၊ frame step၊ loop။
- FR-TML-08 P1 Caption lane tools (bulk nudge, snap-to-voice, inline edit)။
- FR-TML-09 P2 Track height/reorder/collapse။

### Preview / Export
- FR-PRV-01 **P0** Play/Pause/seek၊ audio clock ကို master၊ အသံ/ပုံ ကိုက်။
- FR-PRV-02 P0 Player ပေါ်မှာ စာ ဆွဲ/ချဲ့/လှည့် (handle)၊ center snap။
- FR-PRV-03 P1 Safe-area guide (၉:၁၆၊ ၄:၅)၊ Fullscreen preview။
- FR-EXP-01 **P0** **အသံပါ MP4 (H.264+AAC)** ထုတ်ရ — ffprobe မှာ video+audio stream ပါ၊ duration ±၀.၁ s။
- FR-EXP-02 P0 Codec မရရင် fallback (AAC→Opus၊ H.264→VP9/WebM) + ရှင်းရှင်းလင်းလင်း ပြော။
- FR-EXP-03 P0 Progress/ETA/Cancel၊ ၁၀ မိနစ်ကဗျာ memory မပေါက်။
- FR-EXP-04 P1 Preset (YouTube 1080p၊ Reels 9:16၊ 720p)၊ pre-export checklist။
- FR-EXP-05 P1 File System Access streaming (မရရင် download fallback)။

### System / UX
- FR-SYS-01 P0 Chrome/Edge (လတ်တလော ၂ version) ပံ့ပိုး၊ အခြား browser မှာ ရှင်းရှင်း "မပံ့ပိုး" စာမျက်နှာ (WebCodecs မရှိ စစ်)။
- FR-SYS-02 P0 Error banner (စာမျက်နှာပေါ်၊ **Copy diagnostics** ခလုတ်)။
- FR-SYS-03 P1 Dark/Light၊ Shortcut help (`?`)၊ Tooltip မှာ shortcut။
- FR-SYS-04 P1 Accessibility (keyboard-only editing၊ focus ပြ၊ AA contrast)။
- FR-SYS-05 P2 UI စာလုံး မြန်မာ/English ပြောင်းလို့ရ (strings table ရှိ)။

---

## ၅။ Non-functional requirements (NFR)

| ကဏ္ဍ | စံ |
|---|---|
| Performance | clip ၁၀၀၀ မှာ pan/zoom ≥ ၆၀ fps၊ ကဗျာ ၅ မိနစ် preview ≥ ၃၀ fps၊ project ဖွင့် ≤ ၃ s၊ input→ပြောင်းလဲမှု ≤ ၁၀၀ ms |
| Memory | ဖတ်သံ ၁၀ မိနစ် + Music ၅ မိနစ် + ပုံ ၂၀ ပုံ ထည့်လို့ tab ၂ GB အောက်၊ ရှည်တဲ့ music ကို buffer အပြည့်မသိမ်း (stream/segment) |
| Reliability | autosave ≤ ၁ s၊ IndexedDB error ကို မျိုမချ (ပြ + retry)၊ ဖိုင်မပျက်ရေး (write အပြီးမှ pointer ပြောင်း) |
| Compatibility | Windows 10/11 Chrome/Edge၊ macOS Chrome (best-effort)၊ viewport ≥ ၁၁၀၀×၆၄၀ (ငယ်ရင် အသိပေး) |
| Security | Access ဖွင့် (Release)၊ Worker origin check၊ CSP၊ ASR/အသံ upload မတိုင်ခင် ခွင့်ပြုချက်၊ secrets ကို frontend မထည့် |
| Privacy | ပုံမှန်အားဖြင့် **ဒေတာအားလုံး browser ထဲပဲ** (ASR အသုံးပြုမှသာ အသံ ထွက်)၊ analytics မသုံး (error banner ကိုပဲ local) |
| Maintainability | ဖိုင် ≤ ၃၀၀ လိုင်း၊ လိုင်း ≤ ၁၆၀ လုံး၊ engine unit coverage ≥ ၇၀%၊ CI စိမ်းမှ merge |
| Observability | `window.__fn.diagnostics()` — version၊ browser၊ codec support၊ project stats၊ နောက်ဆုံး error ၂၀ ခု (Copy ခလုတ်) |

---

## ၆။ မြန်မာစာ မပျက်ရေး — စစ်ဆေး corpus (အရေးကြီးဆုံး invariant)

**စည်းမျဉ်း**: Unicode မှန်တဲ့ စာသားကို App က (paste၊ split၊ trim၊ undo၊ save/load၊ export၊ SRT) **တစ်လုံးမှ မပြောင်း**။ ပြောင်းမယ်ဆိုရင် အသုံးပြုသူ confirm ပြီးမှ။
Corpus (`tests/fixtures/myanmar-corpus.txt` ကို ထည့်ရန်): ၁) `ေ`+ဗျည်း (ရေကို၊ တွေကို၊ သူငယ်ချင်းတွေကို)၊ ၂) `္` stacked (ဗုဒ္ဓ၊ မန္တလေး၊ ပဏ္ဍိတ)၊ ၃) `ြ ွ ှ ျ` ပေါင်းစပ် (မြန်မာ၊ ကျွန်တော်၊ မွှေး)၊ ၄) `်` + `့` `း` (နှင့်၊ ကြောင့်)၊ ၅) နံပါတ်/ပုဒ်ဖြတ် (၊ ။ ၁၂၃ ၁၂၃)၊ ၆) မြန်မာ+English+emoji ရောစပ်၊ ၇) စာကြောင်းရှည် (၂၀၀+ လုံး)၊ ၈) **သင့်ကဗျာ အစစ် ၅–၁၀ ပုဒ်** (သင်ပေးရန်)။
Zawgyi corpus: ၁၀ ကြောင်း (အပြောင်းအလဲမှန်ကို သင်အတည်ပြု)။ စစ်ချက်: (က) `valid → same`၊ (ခ) `zawgyi → expected unicode`၊ (ဂ) round-trip save/load၊ (ဃ) SRT/ export စာသားတူ။

---

## ၇။ UX စည်းမျဉ်း (UI ကို ဆုံးဖြတ်တဲ့အခါ လိုက်နာ)

1. **ရွေးတာ → Inspector** (CapCut လို)၊ ရွေးထားတာနဲ့ ဆိုင်တာပဲ ညာဘက်မှာပြ။
2. **ပြောင်းလဲမှုအားလုံး Undo ရ**၊ ဖျက်တာ/အစားထိုးတာကို မေးခွန်းမပါဘဲ မလုပ် (undo ရလို့ confirm မလို၊ project ဖျက်/ဖိုင်ဖျက်သာ confirm)။
3. ၁ s ကျော်ကြာမယ့်အလုပ် = **progress + cancel**။
4. Error စာတန်း = **ဘာဖြစ်လဲ + ဘာလုပ်ရမလဲ** (မြန်မာလို)၊ "Copy diagnostics"။
5. Empty state တိုင်း **ခလုတ်တစ်ခု** (ဥပမာ "ဖတ်သံ ထည့်ပါ")။
6. Shortcut ကို tooltip မှာပြ၊ ဖျက်မရတဲ့ဟာ ခလုတ်မဖျော့ဘဲ အကြောင်းပြ (disabled tooltip)။
7. Layout မရွေ့ (loading ကြောင့် ခလုတ်နေရာမပြောင်း)၊ focus ကို မြင်ရ။
8. Auto/AI ရလဒ်ကို "draft" လို့ ပြပြီး အတည်ပြုခိုင်း။
9. မှားတတ်တာ (Delete, Ripple) ကို Shift/modifier နဲ့သာ၊ ပုံမှန်က လုံခြုံတာ။
10. မြန်မာ microcopy: ရိုးရှင်းတဲ့ ပြောစကားပုံစံ၊ စာလုံးအတိုအရှည်မညီရင် tooltip နဲ့ ဖြည့်။

---

## ၈။ Edge-case စာရင်း (ဘယ်လိုကိုင်တွယ်မလဲ)

| အခြေအနေ | အပြုအမူ |
|---|---|
| ၀ စက္ကန့် / အလွန်တိုတဲ့ clip | အနည်းဆုံး ၁ frame၊ မဖြစ်ရင် ပယ် |
| Audio decode မရ | clip မဖန်တီးဘဲ အကြောင်းရင်းပြ |
| ဖိုင်ကြီးလွန်း (> ၅၀၀ MB) | အသိပေး၊ video ကို proxy/တိုရန် အကြံ |
| Mic ခွင့်ပြုချက်ငြင်း | ဖိုင်တင်လမ်းပြ + browser setting လမ်းညွှန် |
| AudioContext suspended (autoplay policy) | Play ခလုတ် gesture မှာ resume |
| Tab နောက်ခံရောက်/ပြန်လာ | transport ကို ဆက်ပြေးမနေ (pause) + time ပြန်ညှိ |
| Font load မရ | fallback font + စာတန်းမှာ ⚠ ပြ၊ export မတိုင်ခင် သတိပေး |
| IndexedDB quota ပြည့် | save မအောင်ကြောင်း ရှင်း၊ project JSON export ခိုင်း |
| Project နှစ်ခု tab နှစ်ခုမှာ ဖွင့် | နောက်ဖွင့်တဲ့ tab ကို read-only သတိပေး (BroadcastChannel/lock) |
| Export အလယ်မှာ tab ပိတ် | မပြီးသေးသည့်အတွက် `beforeunload` သတိပေး |
| Overlapping drop | auto lane (Plan §5.2) |
| Aspect ratio ပြောင်း | % နေရာမို့ layout လိုက်၊ font size မပြောင်း |
| Zawgyi ထင်ရသော်လည်း မဟုတ်တဲ့စာ | confirm ကြောင့် မပြောင်း |
| Clip ပေါင်းများစွာ ရွေးပြီး ဖျက် | တစ်ကြိမ်တည်း undo |

---

## ၉။ ဒီ Layer ရဲ့ ဆုံးဖြတ်ချက် / မေးခွန်း

| # | မေးခွန်း | ကျွန်တော့် အကြံ (default) |
|---|---|---|
| Q1 | Persona `[A]` မှန်လား (Facebook Reels/TikTok/YouTube ကဗျာဖတ်သူ)? | မှန်ဟု ယူဆ — မှားရင် §၁ ပြင် |
| Q2 | Poem Mode wizard ကို ပင်မ UI မှာ ထားမလား၊ ဒါမှမဟုတ် ရိုးရိုး editor ပဲလား? | **ထည့် (ပိတ်လို့ရ)** — ပထမအသုံးပြုသူ TTFV ကို ကျ |
| Q3 | ၉:၁၆ ကို Reels/TikTok အတွက် အရေးကြီးလား? | P0 |
| Q4 | Loudness normalize (−၁၆ LUFS) ထည့်မလား | P2 |
| Q5 | UI စာလုံး မြန်မာလို ပြောင်းလိုမလား | P2 |
| Q6 | ကိုယ့်ကဗျာ ၅–၁၀ ပုဒ် corpus ပေးနိုင်မလား | **ပေးပါ** (§၆၊ ASR benchmark ပါ) |
