import test from 'node:test';
import assert from 'node:assert/strict';
import { asrEndpoint, checkAsr, transcribeWav } from '../../engine/asr.js';

test('ASR endpoint prefers local provider and normalizes slashes', () => { assert.equal(asrEndpoint({ localUrl: 'http://127.0.0.1:7860/' }), 'http://127.0.0.1:7860'); assert.equal(asrEndpoint({ workerUrl: '/api/transcribe' }), '/api/transcribe'); });
test('ASR health adapter reports provider readiness', async () => { const out = await checkAsr({ localUrl: 'http://asr.test', fetchImpl: async () => new Response(JSON.stringify({ ready: true, engine: 'whisper' }), { status: 200 }) }); assert.equal(out.ready, true); assert.equal(out.engine, 'whisper'); });
test('ASR transcription adapter returns text and sends language', async () => { let request; const text = await transcribeWav(new Blob(['wav']), { workerUrl: '/api/transcribe', lang: 'my', fetchImpl: async (url, init) => { request = { url, init }; return new Response(JSON.stringify({ text: 'မင်္ဂလာပါ' }), { status: 200 }); } }); assert.equal(text, 'မင်္ဂလာပါ'); assert.equal(request.url, '/api/transcribe?lang=my'); assert.equal(request.init.headers['content-type'], 'audio/wav'); });
