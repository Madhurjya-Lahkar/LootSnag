import axios from 'axios';
import { cache } from '../utils/cache.js';
import { CACHE_TTL, LIMITS } from '../config/constants.js';
import { epicLimiter, withRetry } from '../utils/rateLimiter.js';
import logger from '../utils/logger.js';

const ENDPOINT = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions';

export async function getEpicFreeGames() {
  const cacheKey = 'epic_free_games';
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  const data = await epicLimiter.add(() =>
    withRetry(async () => {
      const res = await axios.get(ENDPOINT, {
        params: { locale: 'en-US', country: 'US', allowCountries: 'US' },
        timeout: LIMITS.REQUEST_TIMEOUT,
      });
      return res.data;
    })
  );

  const elements = data?.data?.Catalog?.searchStore?.elements || [];
  const now      = new Date();

  const current  = [];
  const upcoming = [];

  for (const game of elements) {
    const promotions = game.promotions;
    if (!promotions) continue;

    const currentOffers  = promotions.promotionalOffers?.flatMap(p => p.promotionalOffers) || [];
    const upcomingOffers = promotions.upcomingPromotionalOffers?.flatMap(p => p.promotionalOffers) || [];

    const activeFree = currentOffers.find(o =>
      o.discountSetting?.discountPercentage === 0 &&
      new Date(o.startDate) <= now &&
      new Date(o.endDate) > now
    );

    const upcomingFree = upcomingOffers.find(o =>
      o.discountSetting?.discountPercentage === 0
    );

    const normalized = normalizeEpicGame(game);

    if (activeFree) {
      current.push({
        ...normalized,
        endDate:   activeFree.endDate,
        startDate: activeFree.startDate,
        status:    'current',
      });
    } else if (upcomingFree) {
      upcoming.push({
        ...normalized,
        startDate: upcomingFree.startDate,
        endDate:   upcomingFree.endDate,
        status:    'upcoming',
      });
    }
  }

  const result = { current, upcoming };
  cache.set(cacheKey, result, CACHE_TTL.FREE_GAMES);
  logger.api(`Epic: ${current.length} free now, ${upcoming.length} upcoming`);
  return result;
}

function normalizeEpicGame(game) {
  const images     = game.keyImages || [];
  const wideImage  = images.find(i => i.type === 'DieselStoreFrontWide')?.url
                  || images.find(i => i.type === 'OfferImageWide')?.url
                  || images.find(i => i.type === 'Thumbnail')?.url
                  || null;

  const slug       = game.productSlug || game.urlSlug || game.id;
  const url        = slug ? `https://store.epicgames.com/p/${slug}` : 'https://store.epicgames.com/free-games';

  const origPrice  = game.price?.totalPrice?.originalPrice;
  const normalUSD  = origPrice ? (origPrice / 100).toFixed(2) : '0.00';

  return {
    dealId:      `epic_${game.id}`,
    gameId:      `epic_${game.id}`,
    title:       game.title,
    store:       'Epic Games',
    storeId:     '25',
    steamAppId:  null,
    salePrice:   0,
    normalPrice: parseFloat(normalUSD),
    savings:     100,
    imageUrl:    wideImage,
    url,
    type:        'free',
  };
}
