// Root controller running the Lex 8-step loop:
// READ -> TRANSCRIBE -> ISSUE -> TEST -> DRIVE -> REPORT -> LOG -> RESTART
import { chromium } from 'playwright';
import { Allowlist } from './allowlist.js';
import { Light } from './light.js';
import { Pacer, Slope, sleep } from './pacer.js';
import { ApprovalGate } from './approval.js';
import { KillSwitch } from './killswitch.js';
import { open, deliver } from './deliver.js';
import { race } from './race.js';
import { STOP } from './obstacles.js';

export class Robot {
  constructor(opts = {}) {
    this.allowlist = opts.allowlist || new Allowlist();
    this.pacer = opts.pacer || new Pacer();
    this.gate = opts.gate || new ApprovalGate();
    this.kill = opts.kill || new KillSwitch();
    this.light = new Light();
    this.slope = new Slope(opts.maxWorkers || 4);
    this.log = [];
  }
  note(phase, data) { this.log.push({ t: Date.now(), phase, ...data }); if (process.env.X_ROBOT_VERBOSE) console.log(phase, data); }

  async runStep(page, step) {
    for (let attempt = 0; attempt <= this.pacer.maxRetries; attempt++) {
      const { obstacle } = await open(this, page, step.url);
      if (obstacle?.action === STOP) return { ok: false, obstacle };
      if (obstacle) { this.slope.reset(); await sleep(this.pacer.backoff(attempt)); continue; }
      const r = await deliver(this, page, step);
      if (r.ok || r.obstacle.action === STOP) return r;
      this.slope.reset(); await sleep(this.pacer.backoff(attempt));
    }
    return { ok: false, obstacle: { kind: 'retries-exhausted', action: STOP } };
  }

  async run(plan) {
    const browser = await chromium.launch();
    const onSig = () => this.kill.kill();
    process.once('SIGINT', onSig);
    const results = [];
    try {
      const page = await browser.newPage();
      for (const raw of plan) {
        this.note('READ', { step: raw });                       // 1 READ
        const step = Array.isArray(raw) ? { paths: raw } : raw;  // 2 TRANSCRIBE
        this.note('ISSUE', { url: step.url || 'race' });        // 3 ISSUE
        try { this.kill.check(); } catch { this.light.dark('kill switch'); break; } // 4 TEST
        const r = step.paths                                     // 5 DRIVE
          ? await race(this, browser, step.paths, (pg, p) => this.runStep(pg, p))
          : await this.runStep(page, step);
        results.push(r);
        if (!r.ok) { this.light.dark(r.obstacle.kind); this.note('REPORT', r); break; } // 6 REPORT
        this.slope.up();
        this.note('LOG', { value: r.value });                   // 7 LOG
      }                                                          // 8 RESTART (next step)
    } catch (e) {
      this.light.dark(e.kind || e.message);
    } finally {
      process.off('SIGINT', onSig);
      await browser.close();
    }
    return { light: this.light.state, reason: this.light.reason, results };
  }
}
