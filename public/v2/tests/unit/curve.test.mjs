import test from 'node:test';
import assert from 'node:assert/strict';
import { curvePoints, curvePolyline, timeFromX, valueFromY, FIELD_RANGE, CURVE_FIELDS } from '../../ui/curve-core.js';

const keys = [{ t: 0, x: 50, y: 50, scale: 1, opacity: 100 }, { t: 4, x: 100, y: 0, scale: 3, opacity: 0 }];

test('curvePoints maps time and value into the box', () => {
  const pts = curvePoints(keys, 'x', 200, 100, 0, 4);
  assert.deepEqual(pts.map((p) => Math.round(p.x)), [0, 200]);
  assert.equal(Math.round(pts[0].y), 50);
  assert.equal(Math.round(pts[1].y), 0);
});

test('opacity and scale use their own ranges', () => {
  const op = curvePoints(keys, 'opacity', 100, 100, 0, 4);
  assert.equal(Math.round(op[0].y), 0);
  assert.equal(Math.round(op[1].y), 100);
  assert.deepEqual(FIELD_RANGE.scale, [0, 4]);
  assert.equal(CURVE_FIELDS.length, 4);
});

test('timeFromX and valueFromY invert the mapping', () => {
  assert.equal(timeFromX(100, 200, 0, 4), 2);
  assert.equal(timeFromX(999, 200, 0, 4), 4);
  assert.equal(valueFromY(0, 'x', 100), 100);
  assert.equal(valueFromY(100, 'x', 100), 0);
  assert.equal(valueFromY(50, 'scale', 100), 2);
});

test('curvePolyline joins points', () => {
  assert.equal(curvePolyline([{ x: 1.04, y: 2.06 }, { x: 3, y: 4 }]), '1.0,2.1 3.0,4.0');
});
