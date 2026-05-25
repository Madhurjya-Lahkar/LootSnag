import { LIMITS } from '../config/constants.js';

class RateLimiter {
  constructor(requestsPerSecond = 2) {
    this.interval = 1000 / requestsPerSecond;
    this.queue    = [];
    this.running  = false;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      if (!this.running) this.run();
    });
  }

  async run() {
    this.running = true;
    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      if (this.queue.length > 0) {
        await new Promise(r => setTimeout(r, this.interval));
      }
    }
    this.running = false;
  }
}

export async function withRetry(fn, attempts = LIMITS.RETRY_ATTEMPTS, delay = LIMITS.RETRY_DELAY) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
    }
  }
  throw lastErr;
}

export const cheapsharkLimiter = new RateLimiter(2);
export const rawgLimiter       = new RateLimiter(1);
export const steamLimiter      = new RateLimiter(1);
export const epicLimiter       = new RateLimiter(2);
