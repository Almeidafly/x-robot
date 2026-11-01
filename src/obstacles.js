// Target reports obstacles; each maps to retry, or stop.
export const STOP = 'stop', RETRY = 'retry';

export class Obstacle extends Error {
  constructor(kind, action, detail = '') { super(`${kind}${detail ? ': ' + detail : ''}`); this.kind = kind; this.action = action; }
}

export async function detectObstacles(page, response) {
  if (response && response.status() === 429) return new Obstacle('rate-limit', RETRY);
  const captcha = await page.$('.g-recaptcha, .h-captcha, iframe[src*="captcha"], #captcha');
  if (captcha) return new Obstacle('captcha', STOP, 'captchas are never bypassed');
  const signin = await page.$('input[type="password"]');
  if (signin) return new Obstacle('sign-in-wall', STOP, 'hand off to a human');
  return null;
}
