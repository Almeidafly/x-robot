import test from 'node:test';
import assert from 'node:assert';
import { Allowlist } from '../src/allowlist.js';
import { Light } from '../src/light.js';

test('allowlist defaults to loopback only', () => {
  const a = new Allowlist();
  assert.ok(a.allows('http://127.0.0.1:1234/'));
  assert.ok(!a.allows('https://example.com/'));
  assert.throws(() => a.check('https://x.com/'));
});

test('light lit/dark', () => {
  const l = new Light();
  assert.equal(String(l), 'LIGHT: lit');
  l.dark('captcha');
  assert.equal(String(l), 'LIGHT: dark (captcha)');
});
