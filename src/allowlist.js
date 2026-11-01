// Default: only the local fixture (loopback). Add hosts you own or may automate.
export class Allowlist {
  constructor(hosts = ['127.0.0.1', 'localhost']) { this.hosts = new Set(hosts); }
  allows(url) {
    try { return this.hosts.has(new URL(url).hostname); } catch { return false; }
  }
  check(url) { if (!this.allows(url)) throw new Error(`not on allowlist: ${url}`); }
}
