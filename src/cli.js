#!/usr/bin/env node
// Usage: x-robot plan.json [--approve prompt|queue|deny] [--allow host,host]
//        x-robot --demo     (starts the local fixture and runs a demo plan)
import { readFile } from 'node:fs/promises';
import { Robot } from './robot.js';
import { Allowlist } from './allowlist.js';
import { ApprovalGate } from './approval.js';
import { startFixture } from './fixture-server.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const mode = opt('--approve', 'prompt');
const extra = (opt('--allow', '') || '').split(',').filter(Boolean);
const allowlist = new Allowlist(['127.0.0.1', 'localhost', ...extra]);

let plan, fixture;
if (args.includes('--demo')) {
  fixture = await startFixture();
  plan = [
    { url: fixture.url + '/', fill: { selector: '#payload', value: 'hello' }, click: '#go', read: '#result', writeBack: 'h1', outbound: true },
    [{ url: fixture.url + '/nope.html', read: '#result' }, { url: fixture.url + '/limited', read: '#result' }],
  ];
} else {
  plan = JSON.parse(await readFile(args[0], 'utf8'));
}
const robot = new Robot({ allowlist, gate: new ApprovalGate({ mode }) });
const out = await robot.run(plan);
console.log(JSON.stringify(out.results, null, 2));
console.log(robot.light.toString());
if (fixture) await fixture.close();
process.exit(out.light === 'lit' ? 0 : 1);
