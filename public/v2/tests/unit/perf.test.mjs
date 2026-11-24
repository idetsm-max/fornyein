import test from 'node:test';
import assert from 'node:assert/strict';
import { createQualityGovernor } from '../../engine/perf.js';

test('quality drops after a run of slow frames', () => {
  const g = createQualityGovernor({ downAfter: 4 });
  assert.equal(g.level, 1);
  for (let i = 0; i < 3; i++) assert.equal(g.sample({ ms: 60 }), 1);
  assert.equal(g.sample({ ms: 60 }), 0.75);
  for (let i = 0; i < 8; i++) g.sample({ ms: 60 });
  assert.equal(g.level, 0.5);
});

test('quality climbs back after a long run of fast frames', () => {
  const g = createQualityGovernor({ downAfter: 2, upAfter: 5 });
  g.sample({ ms: 80 }); g.sample({ ms: 80 });
  assert.equal(g.level, 0.75);
  for (let i = 0; i < 4; i++) assert.equal(g.sample({ ms: 10 }), 0.75);
  assert.equal(g.sample({ ms: 10 }), 1);
});

test('one slow frame does not undo a recovery streak', () => {
  const g = createQualityGovernor({ downAfter: 3, upAfter: 3 });
  g.sample({ ms: 90 }); g.sample({ ms: 90 }); g.sample({ ms: 90 });
  assert.equal(g.level, 0.75);
  g.sample({ ms: 5 }); g.sample({ ms: 5 }); g.sample({ ms: 50 }); g.sample({ ms: 5 }); g.sample({ ms: 5 });
  assert.equal(g.level, 0.75);
  assert.equal(g.sample({ ms: 5 }), 1);
});

test('governor ignores junk samples and never leaves its range', () => {
  const g = createQualityGovernor({ levels: [1, 0.5], downAfter: 1, upAfter: 1 });
  assert.equal(g.sample({ ms: NaN }), 1);
  assert.equal(g.sample({ ms: 100 }), 0.5);
  assert.equal(g.sample({ ms: 100 }), 0.5);
  assert.equal(g.sample({ ms: 1 }), 1);
});
