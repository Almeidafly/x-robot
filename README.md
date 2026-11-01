# x-robot

A design for a **browser robot**: a small controller that clicks, reads, and reports inside a web browser, one careful step at a time.

Status: **design only** (no code yet). See [DESIGN.md](DESIGN.md).

## In one paragraph
A click (the trigger) starts a local action (a content script). That action delivers a payload — data or a command — to a target (an element, a page, or an API). The target's result comes back to the controller, which decides the next step using the Lex 8-step loop (READ → TRANSCRIBE → ISSUE → TEST → DRIVE → … → RESTART). Results are written back into the target page. The robot paces itself (throttling, debounce, backoff), treats obstacles as reasons to slow down or stop, and reports its state as a CI light: **lit** (working) or **dark** (not working).

## Ground rules
- Runs only on sites the operator owns or is permitted to automate.
- Respects robots.txt, terms of service, and rate limits.
- A captcha is a **stop** — never bypassed.
- Every outbound action needs approval (layer 2).

No license yet — pending owner review.

## Run it
```bash
npm install
npx playwright install chromium
npm test                                   # all tests, local fixture only
node src/cli.js --demo --approve prompt    # demo on the local fixture; asks y/N before the outbound click
node src/cli.js plan.json --approve queue  # file approval queue: set "decision" to "approved" in approvals/*.json
```
Kill switch: Ctrl-C, or create a file named `STOP` in the working directory. The run ends with `LIGHT: lit` or `LIGHT: dark (<reason>)`.
Only `127.0.0.1`/`localhost` are allowed by default; `--allow host` adds hosts you own or may automate.

Branch model: see [BRANCHES.md](BRANCHES.md).
