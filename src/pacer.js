// Throttle + exponential backoff + micro-slope ramp.
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export class Pacer {
  constructor({ minGapMs = 250, baseBackoffMs = 200, maxBackoffMs = 5000, maxRetries = 3 } = {}) {
    Object.assign(this, { minGapMs, baseBackoffMs, maxBackoffMs, maxRetries });
    this.last = 0;
  }
  async throttle() {
    const wait = this.last + this.minGapMs - Date.now();
    if (wait > 0) await sleep(wait);
    this.last = Date.now();
  }
  backoff(attempt) { return Math.min(this.maxBackoffMs, this.baseBackoffMs * 2 ** attempt); }
}

// Micro slope: 1 -> 2 -> 4 ... up to max, reset to 1 on trouble.
export class Slope {
  constructor(max = 4) { this.max = max; this.step = 1; }
  up() { this.step = Math.min(this.max, this.step * 2); }
  reset() { this.step = 1; }
}
