import axios from 'axios';
import { cache } from '../utils/cache.js';
import { CACHE_TTL, LIMITS, STORE_ID_MAP } from '../config/constants.js';
import { cheapsharkLimiter, withRetry } from '../utils/rateLimiter.js';
import logger from '../utils/logger.js';

const BASE = 'https://www.cheapshark.com/api/1.0';

async function csGet(path, params = {}) {
  return cheapsharkLimiter.add(() =>
    withRetry(async () => {
      const res = await axios.get(`${BASE}${path}`, {
        params,
        timeout: LIMITS.REQUEST_TIMEOUT,
      });
      return res.data;
    })
  );
}

export async function getFreeDeals() {
  const cacheKey = 'cs_free_deals';
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  const deals = await csGet('/deals', {
    upperPrice: 0,
    sortBy:     'recent',
    pageSize:   60,
  });

  const free = deals.filter(d =>
    parseFloat(d.normalPrice) > 0 &&
    parseFloat(d.salePrice) === 0
  ).map(normalizeDeal);

  cache.set(cacheKey, free, CACHE_TTL.FREE_GAMES);
  logger.api(`CheapShark: fetched ${free.length} free deals`);
  return free;
}

export async function getTopDeals(threshold = 80) {
  const cacheKey = `cs_deals_${threshold}`;
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  const deals = await csGet('/deals', {
    sortBy:     'Savings',
    lowerPrice: 0.01,
    pageSize:   LIMITS.DEAL_PAGE_SIZE,
  });

  const filtered = deals
    .filter(d => parseFloat(d.savings) >= threshold)
    .map(normalizeDeal);

  cache.set(cacheKey, filtered, CACHE_TTL.DEALS);
  logger.api(`CheapShark: fetched ${filtered.length} deals >= ${threshold}%`);
  return filtered;
}

export async function searchGames(title) {
  const cacheKey = `cs_search_${title.toLowerCase().slice(0, 40)}`;
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  const games = await csGet('/games', {
    title,
    limit:       LIMITS.SEARCH_RESULTS_MAX,
    exact:       0,
    steamworks:  0,
  });

  if (!games || games.length === 0) return [];

  const results = await Promise.all(
    games.slice(0, LIMITS.SEARCH_RESULTS_MAX).map(async game => {
      const info = await csGet('/game', { id: game.gameID }).catch(() => null);
      if (!info) return null;

      const deals = (info.deals || []).map(d => ({
        storeId:      d.storeID,
        storeName:    STORE_ID_MAP[d.storeID] || `Store ${d.storeID}`,
        salePrice:    d.price,
        normalPrice:  d.retailPrice,
        savings:      d.savings,
        dealId:       d.dealID,
        url:          `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
      }));

      return {
        gameId:      game.gameID,
        title:       info.info?.title || game.external,
        steamAppId:  info.info?.steamAppID || null,
        thumb:       info.info?.thumb || null,
        cheapestDeal: deals.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice))[0] || null,
        deals,
      };
    })
  );

  const valid = results.filter(Boolean);
  cache.set(cacheKey, valid, CACHE_TTL.SEARCH);
  return valid;
}

function normalizeDeal(d) {
  return {
    dealId:      d.dealID,
    gameId:      d.gameID,
    title:       d.title,
    store:       STORE_ID_MAP[d.storeID] || `Store ${d.storeID}`,
    storeId:     d.storeID,
    salePrice:   parseFloat(d.salePrice),
    normalPrice: parseFloat(d.normalPrice),
    savings:     parseFloat(d.savings),
    steamAppId:  d.steamAppID || null,
    thumb:       d.thumb || null,
    url:         `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
    type:        parseFloat(d.salePrice) === 0 ? 'free' : 'deal',
  };
}
