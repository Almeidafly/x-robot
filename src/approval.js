// Layer 2: every outbound action needs approval. Nothing outbound without it.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import readline from 'node:readline/promises';
import path from 'node:path';
import { sleep } from './pacer.js';

export class ApprovalGate {
  // mode: 'prompt' (CLI y/N), 'queue' (file-based), or 'deny' (default for tests / CI)
  constructor({ mode = 'deny', dir = 'approvals', timeoutMs = 60000, pollMs = 500 } = {}) {
    Object.assign(this, { mode, dir, timeoutMs, pollMs });
    this.seq = 0;
  }
  async request(action) {
    if (this.mode === 'prompt') {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const a = await rl.question(`Approve outbound action ${JSON.stringify(action)}? [y/N] `);
      rl.close();
      return /^y(es)?$/i.test(a.trim());
    }
    if (this.mode === 'queue') {
      await mkdir(this.dir, { recursive: true });
      const id = `${Date.now()}-${++this.seq}`;
      const file = path.join(this.dir, `${id}.json`);
      await writeFile(file, JSON.stringify({ id, action, decision: 'pending' }, null, 2));
      const end = Date.now() + this.timeoutMs;
      while (Date.now() < end) {
        const { decision } = JSON.parse(await readFile(file, 'utf8'));
        if (decision === 'approved') return true;
        if (decision === 'denied') return false;
        await sleep(this.pollMs);
      }
      return false; // timeout = denied
    }
    return false;
  }
}
