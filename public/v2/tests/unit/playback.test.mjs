import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newAudioClip, audioTrack } from '../../engine/model.js';
import { planSchedule, fadeAt } from '../../engine/playback.js';
import { gainEnvelope, buildImpulse, mulberry32, clipGain, clipPan, clamp } from '../../engine/audio-graph.js';

function setup(patch = {}, trackPatch = {}) {
  const p = newProject();
  const clip = newAudioClip(2, 'm1', 4, 'music');
  Object.assign(clip, patch);
  const track = audioTrack(p);
  Object.assign(track, trackPatch);
  track.clips.push(clip);
  p.media = { m1: { id: 'm1', kind: 'audio', name: 'm1', dur: 10 } };
  return { p, clip, track };
}

test('schedule starts a clip at its timeline start', () => {
  const { p } = setup();
  const [event] = planSchedule(p, 0);
  assert.equal(event.when, 2);
  assert.equal(event.offset, 0);
  assert.equal(event.dur, 4);
  assert.equal(event.gain, 1);
});

test('schedule seeks into the middle of a clip', () => {
  const { p } = setup();
  const [event] = planSchedule(p, 3);
  assert.equal(event.when, 0);
  assert.equal(event.offset, 1);
  assert.equal(event.localOffset, 1);
  assert.equal(event.dur, 3);
});

test('schedule honours the trimmed source range', () => {
  const { p } = setup({ src: { mediaId: 'm1', in: 2, out: 6 } });
  const [event] = planSchedule(p, 2);
  assert.equal(event.offset, 2);
  assert.equal(event.srcDur, 4);
  const later = planSchedule(p, 4)[0];
  assert.equal(later.offset, 4);
  assert.equal(later.srcDur, 2);
});

test('looped clips wrap their source offset', () => {
  const { p } = setup({ src: { mediaId: 'm1', in: 1, out: 3 }, dur: 10, loop: true });
  const [event] = planSchedule(p, 4);
  assert.equal(event.offset, 1);
  assert.equal(event.srcDur, 2);
  assert.equal(event.loopStart, 1);
  assert.equal(event.loopEnd, 3);
});

test('muted, hidden and soloed tracks are respected', () => {
  const { p, track } = setup();
  track.muted = true;
  assert.equal(planSchedule(p, 0).length, 0);
  track.muted = false;
  track.hidden = true;
  assert.equal(planSchedule(p, 0).length, 0);
  track.hidden = false;
  const second = newAudioClip(0, 'm2', 2, 'voice');
  audioTrack(p).clips.push(second);
  audioTrack(p).solo = false;
  const other = newAudioClip(0, 'm2', 2, 'voice');
  other.id = 'other';
  const extra = { ...audioTrack(p), id: 'trk2', solo: true, clips: [other] };
  p.tracks.push(extra);
  assert.deepEqual(planSchedule(p, 0).map((e) => e.clipId), ['other']);
});

test('music ducks under a voice clip when the track asks for it', () => {
  const { p, track } = setup({}, { mixer: { ducking: true } });
  const voice = newAudioClip(3, 'm2', 1, 'voice');
  voice.role = 'voice';
  track.clips.push(voice);
  p.media.m2 = { id: 'm2', kind: 'audio', dur: 1 };
  const music = planSchedule(p, 0).find((e) => e.clipId !== voice.id);
  assert.equal(music.gain, 0.35);
});

test('fades are evaluated in clip-local time', () => {
  const { p } = setup({ fade: { in: 1, out: 1 } });
  const [event] = planSchedule(p, 2.5);
  assert.equal(event.localOffset, 0.5);
  assert.equal(fadeAt(event), 0.5);
  const [end] = planSchedule(p, 5.5);
  assert.equal(fadeAt(end), 0.5);
});

test('gain envelope ramps in and out', () => {
  const env = gainEnvelope({ when: 1, dur: 2, gain: 0.8, fadeIn: 0.5, fadeOut: 0.5 });
  assert.deepEqual(env, [
    { time: 1, value: 0, ramp: false },
    { time: 1.5, value: 0.8, ramp: true },
    { time: 2.5, value: 0.8, ramp: false },
    { time: 3, value: 0, ramp: true },
  ]);
  const mid = gainEnvelope({ when: 0, dur: 2, gain: 1, fadeIn: 1, local: 0.5 });
  assert.equal(mid[0].value, 0.5);
});

test('impulse response is deterministic', () => {
  const ctx = {
    sampleRate: 64,
    createBuffer: (ch, len) => {
      const data = Array.from({ length: ch }, () => new Float32Array(len));
      return { numberOfChannels: ch, length: len, getChannelData: (i) => data[i] };
    },
  };
  const a = buildImpulse(ctx, 0.25, 2, 42), b = buildImpulse(ctx, 0.25, 2, 42), c = buildImpulse(ctx, 0.25, 2, 43);
  assert.deepEqual(Array.from(a.getChannelData(0)), Array.from(b.getChannelData(0)));
  assert.notDeepEqual(Array.from(a.getChannelData(0)), Array.from(c.getChannelData(0)));
  const r1 = mulberry32(7), r2 = mulberry32(7);
  assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()]);
});

test('clip gain and pan combine with the track mixer and clamp', () => {
  const { clip, track } = setup({ gain: 2, volume: 1.5, pan: 0.8 });
  track.mixer = { volume: 1.5, pan: 0.5 };
  assert.equal(clipGain(clip, track), 2);
  assert.equal(clipPan(clip, track), 1);
  assert.equal(clamp(3, 0, 2), 2);
  assert.equal(clamp(-3, 0, 2), 0);
});
