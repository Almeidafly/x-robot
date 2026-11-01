// One action turns the light dark and stops all workers: call kill(), send SIGINT, or create the STOP file.
import { existsSync } from 'node:fs';
export class KillSwitch {
  constructor(stopFile = 'STOP') { this.stopFile = stopFile; this.killed = false; }
  kill() { this.killed = true; }
  get on() { return this.killed || existsSync(this.stopFile); }
  check() { if (this.on) throw Object.assign(new Error('kill switch'), { kind: 'killed' }); }
}
