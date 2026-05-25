import axios from 'axios';
import { cache } from '../utils/cache.js';
import { CACHE_TTL, LIMITS } from '../config/constants.js';
import { withRetry } from '../utils/rateLimiter.js';
import { query } from '../database/connection.js';
import logger from '../utils/logger.js';

const CACHE_KEY = 'exchange_rate_USD_INR';
const ENDPOINT  = 'https://api.frankfurter.app/latest?from=USD&to=INR';

export async function getUSDtoINR() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const rate = await withRetry(async () => {
      const res = await axios.get(ENDPOINT, { timeout: LIMITS.REQUEST_TIMEOUT });
      return res.data.rates.INR;
    });

    cache.set(CACHE_KEY, rate, CACHE_TTL.EXCHANGE_RATE);

    await query(
      `INSERT INTO exchange_rates (base_currency, target_currency, rate)
       VALUES ('USD', 'INR', ?)
       ON DUPLICATE KEY UPDATE rate = ?, updated_at = NOW()`,
      [rate, rate]
    ).catch(() => {});

    logger.api(`Exchange rate fetched: 1 USD = ${rate} INR`);
    return rate;
  } catch (err) {
    logger.error('Failed to fetch exchange rate, using fallback', err.message);
    return 84;
  }
}

export function convertPrice(usdPrice, rate) {
  return parseFloat(usdPrice) * rate;
}
