import axios from 'axios';
import { cache } from '../utils/cache.js';
import { CACHE_TTL, LIMITS } from '../config/constants.js';
import { rawgLimiter, withRetry } from '../utils/rateLimiter.js';
import logger from '../utils/logger.js';
import 'dotenv/config';

export function getSteamImage(steamAppId) {
  if (!steamAppId) return null;
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
}

const CACHE_NULL = '__null__';

export async function getRAWGImage(title) {
  if (!process.env.RAWG_API_KEY) return null;
  const key = `rawg_img_${title.toLowerCase().slice(0, 40)}`;
  const cached = cache.get(key);
  if (cached !== null) return cached === CACHE_NULL ? null : cached;

  try {
    const imageUrl = await rawgLimiter.add(() =>
      withRetry(async () => {
        const res = await axios.get('https://api.rawg.io/api/games', {
          params: { key: process.env.RAWG_API_KEY, search: title, page_size: 1 },
          timeout: LIMITS.REQUEST_TIMEOUT,
        });
        return res.data.results?.[0]?.background_image || null;
      })
    );

    cache.set(key, imageUrl ?? CACHE_NULL, CACHE_TTL.SEARCH);
    return imageUrl;
  } catch (err) {
    logger.api(`RAWG image lookup failed for "${title}"`, err.message);
    return null;
  }
}

export async function resolveGameImage(steamAppId, epicImageUrl, title) {
  if (steamAppId) return getSteamImage(steamAppId);
  if (epicImageUrl) return epicImageUrl;
  if (title) return getRAWGImage(title);
  return null;
}
