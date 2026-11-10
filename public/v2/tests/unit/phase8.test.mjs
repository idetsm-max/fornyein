import test from 'node:test';
import assert from 'node:assert/strict';
import { ASR_ENDPOINT, asrEndpoint, checkAsr, transcribeWav } from '../../engine/asr.js';

test('ASR endpoint is fixed to the Cloudflare Worker route', () => { assert.equal(asrEndpoint(), ASR_ENDPOINT); assert.equal(asrEndpoint({ localUrl: 'http://127.0.0.1:7860/' }), ASR_ENDPOINT); });
test('ASR health adapter reports Cloudflare Workers AI Whisper readiness', async () => { const out = await checkAsr({ fetchImpl: async () => new Response(JSON.stringify({ ready: true, engine: 'workers-ai', model: '@cf/openai/whisper-large-v3-turbo' }), { status: 200 }) }); assert.equal(out.ready, true); assert.equal(out.engine, 'workers-ai'); });
test('Worker Whisper transcription returns text and sends language', async () => { let request; const text = await transcribeWav(new Blob(['wav']), { lang: 'my', fetchImpl: async (url, init) => { request = { url, init }; return new Response(JSON.stringify({ text: 'မင်္ဂလာပါ', engine: 'workers-ai' }), { status: 200 }); } }); assert.equal(text, 'မင်္ဂလာပါ'); assert.equal(request.url, '/api/transcribe?lang=my'); assert.equal(request.init.headers['content-type'], 'audio/wav'); });
