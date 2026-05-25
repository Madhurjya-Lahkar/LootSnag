import axios from 'axios';
import { steamLimiter, withRetry } from '../utils/rateLimiter.js';
import { LIMITS } from '../config/constants.js';
import logger from '../utils/logger.js';

export async function getSteamAppDetails(appId) {
  try {
    const data = await steamLimiter.add(() =>
      withRetry(async () => {
        const res = await axios.get('https://store.steampowered.com/api/appdetails', {
          params: { appids: appId, filters: 'price_overview,basic' },
          timeout: LIMITS.REQUEST_TIMEOUT,
        });
        return res.data[appId]?.data || null;
      })
    );
    return data;
  } catch (err) {
    logger.api(`Steam app details failed for ${appId}`, err.message);
    return null;
  }
}

export async function isFreeWeekend(appId) {
  const data = await getSteamAppDetails(appId);
  if (!data) return false;
  const price = data.price_overview;
  return price?.discount_percent === 100 && price?.final === 0;
}
