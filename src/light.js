// Output signal: lit (working) or dark (stopped / failed).
export class Light {
  constructor() { this.state = 'lit'; this.reason = ''; }
  lit() { this.state = 'lit'; this.reason = ''; }
  dark(reason) { this.state = 'dark'; this.reason = reason; }
  toString() { return this.state === 'lit' ? 'LIGHT: lit' : `LIGHT: dark (${this.reason})`; }
}
