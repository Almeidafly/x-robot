// trigger -> local action -> deliver payload -> read back -> write back
import { detectObstacles, STOP } from './obstacles.js';

export async function open(ctx, page, url) {
  ctx.allowlist.check(url);
  ctx.kill.check();
  await ctx.pacer.throttle();
  const res = await page.goto(url);
  return { res, obstacle: await detectObstacles(page, res) };
}

// step: { url, fill?: {selector, value}, click?: selector, read: selector, writeBack?: selector, outbound?: bool }
export async function deliver(ctx, page, step) {
  if (step.outbound) {
    const ok = await ctx.gate.request({ url: step.url, click: step.click, fill: step.fill });
    if (!ok) return { ok: false, obstacle: { kind: 'not-approved', action: STOP } };
  }
  if (step.fill) await page.fill(step.fill.selector, String(step.fill.value));
  if (step.click) { ctx.kill.check(); await ctx.pacer.throttle(); await page.click(step.click); }
  const el = await page.$(step.read);
  if (!el) return { ok: false, obstacle: { kind: 'missing-element', action: 'retry', selector: step.read } };
  const value = await el.textContent();
  if (step.writeBack) await page.evaluate(([s, v]) => {
    const t = document.querySelector(s); if (t) t.setAttribute('data-x-robot', v);
  }, [step.writeBack, value]);
  return { ok: true, value };
}
