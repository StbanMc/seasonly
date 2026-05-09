import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/components/particles-rng.js';

test('createRng with the same seed produces the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 10; i++) {
    assert.equal(a.next(), b.next());
  }
});

test('createRng with different seeds produces different sequences', () => {
  const a = createRng(1);
  const b = createRng(2);
  let differs = false;
  for (let i = 0; i < 5 && !differs; i++) {
    if (a.next() !== b.next()) differs = true;
  }
  assert.equal(differs, true);
});

test('createRng output stays in [0, 1)', () => {
  const r = createRng(123);
  for (let i = 0; i < 100; i++) {
    const v = r.next();
    assert.ok(v >= 0 && v < 1, 'value ' + v + ' out of [0,1)');
  }
});

test('range respects bounds with seeded rng', () => {
  const r = createRng(7);
  for (let i = 0; i < 50; i++) {
    const v = r.range(10, 20);
    assert.ok(v >= 10 && v < 20);
  }
});

test('int returns integers within inclusive bounds', () => {
  const r = createRng(7);
  for (let i = 0; i < 100; i++) {
    const v = r.int(0, 5);
    assert.equal(Number.isInteger(v), true);
    assert.ok(v >= 0 && v <= 5);
  }
});

test('pick returns a member of the array', () => {
  const r = createRng(42);
  const arr = ['a', 'b', 'c', 'd'];
  for (let i = 0; i < 20; i++) {
    assert.ok(arr.includes(r.pick(arr)));
  }
});

test('pick returns undefined for empty/invalid arrays', () => {
  const r = createRng(42);
  assert.equal(r.pick([]), undefined);
  assert.equal(r.pick(null), undefined);
  assert.equal(r.pick('not an array'), undefined);
});

test('unseeded rng falls back to Math.random and is marked seeded:false', () => {
  const r = createRng(null);
  assert.equal(r.seeded, false);
  const v = r.next();
  assert.ok(v >= 0 && v < 1);
});

test('createRng rejects non-finite seeds', () => {
  assert.throws(() => createRng(NaN), /finite number/);
  assert.throws(() => createRng(Infinity), /finite number/);
  assert.throws(() => createRng('seed'), /finite number/);
});
