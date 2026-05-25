export const CV2_FLAG = 1 << 15;

export const STORE_ID_MAP = {
  '1':  'Steam',
  '7':  'GOG',
  '11': 'Humble Bundle',
  '13': 'Ubisoft',
  '15': 'Fanatical',
  '25': 'Epic Games',
  '28': 'itch.io',
};

export const STORE_SLUG_MAP = {
  steam:     '1',
  gog:       '7',
  humble:    '11',
  ubisoft:   '13',
  fanatical: '15',
  epic:      '25',
  itch:      '28',
};

export const CRON_SCHEDULES = {
  FREE_GAMES: '0 */2 * * *',
  DEALS:      '0 */4 * * *',
  WISHLISTS:  '0 */6 * * *',
  CLEANUP:    '0 3 * * *',
  RATES:      '0 */6 * * *',
};

export const CACHE_TTL = {
  SEARCH:        5  * 60 * 1000,
  EXCHANGE_RATE: 6  * 60 * 60 * 1000,
  FREE_GAMES:    2  * 60 * 60 * 1000,
  DEALS:         4  * 60 * 60 * 1000,
  STORES:        24 * 60 * 60 * 1000,
};

export const LIMITS = {
  WISHLIST_MAX:       50,
  SEARCH_RESULTS_MAX: 5,
  DEAL_PAGE_SIZE:     60,
  REQUEST_TIMEOUT:    10000,
  RETRY_ATTEMPTS:     3,
  RETRY_DELAY:        2000,
};

export const DEFAULT = {
  THRESHOLD: 80,
  CURRENCY:  'INR',
};
