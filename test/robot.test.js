import test from 'node:test';
import assert from 'node:assert';
import { Robot } from '../src/robot.js';
import { Pacer } from '../src/pacer.js';
import { KillSwitch } from '../src/killswitch.js';
import { startFixture } from '../src/fixture-server.js';

const fast = () => new Pacer({ minGapMs: 0, baseBackoffMs: 1, maxRetries: 2 });
const approveAll = { request: async () => true };
let fx;
test.before(async () => { fx = await startFixture(); });
test.after(async () => { await fx.close(); });

test('trigger -> deliver -> read back -> write back, lit', async () => {
  const r = new Robot({ pacer: fast(), gate: approveAll });
  const out = await r.run([{ url: fx.url + '/', fill: { selector: '#payload', value: 'hi' }, click: '#go', read: '#result', writeBack: 'h1', outbound: true }]);
  assert.equal(out.light, 'lit');
  assert.equal(out.results[0].value, 'got:hi');
});

test('outbound without approval goes dark', async () => {
  const out = await new Robot({ pacer: fast() }).run([{ url: fx.url + '/', click: '#go', read: '#result', outbound: true }]);
  assert.equal(out.light, 'dark');
  assert.equal(out.reason, 'not-approved');
});

test('captcha is a stop', async () => {
  const out = await new Robot({ pacer: fast() }).run([{ url: fx.url + '/captcha.html', read: '#x' }]);
  assert.equal(out.reason, 'captcha');
});

test('sign-in wall is a stop', async () => {
  const out = await new Robot({ pacer: fast() }).run([{ url: fx.url + '/signin.html', read: '#x' }]);
  assert.equal(out.reason, 'sign-in-wall');
});

test('rate limit backs off and retries', async () => {
  const out = await new Robot({ pacer: fast() }).run([{ url: fx.url + '/limited', read: '#result' }]);
  assert.equal(out.light, 'lit');
  assert.equal(out.results[0].value, 'ok');
});

test('missing element retries then goes dark', async () => {
  const out = await new Robot({ pacer: fast() }).run([{ url: fx.url + '/', read: '#nope' }]);
  assert.equal(out.reason, 'retries-exhausted');
});

test('off-allowlist goes dark without loading', async () => {
  const out = await new Robot({ pacer: fast() }).run([{ url: 'https://example.com/', read: 'h1' }]);
  assert.equal(out.light, 'dark');
  assert.match(out.reason, /allowlist/);
});

test('parallel read-only paths keep the winner', async () => {
  const out = await new Robot({ pacer: fast() }).run([[{ url: fx.url + '/', read: '#nope' }, { url: fx.url + '/', read: 'h1' }]]);
  assert.equal(out.light, 'lit');
  assert.equal(out.results[0].value, 'x-robot local fixture');
});

test('outbound paths may not race', async () => {
  const out = await new Robot({ pacer: fast(), gate: approveAll }).run([[{ url: fx.url + '/', read: 'h1', outbound: true }]]);
  assert.equal(out.light, 'dark');
});

test('kill switch goes dark', async () => {
  const kill = new KillSwitch('/nonexistent/STOP'); kill.kill();
  const out = await new Robot({ pacer: fast(), kill }).run([{ url: fx.url + '/', read: 'h1' }]);
  assert.equal(out.reason, 'kill switch');
});
