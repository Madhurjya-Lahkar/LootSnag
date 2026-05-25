import cron from 'node-cron';
import { CRON_SCHEDULES } from '../config/constants.js';
import { checkFreeGames } from '../cron/freeGames.js';
import { checkDeals } from '../cron/deals.js';
import { checkWishlists } from '../cron/wishlist.js';
import { cleanupStaleData } from '../cron/cleanup.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import logger from '../utils/logger.js';

const activeCrons = new Map();

export function startCrons(client) {
  activeCrons.set('freegames', cron.schedule(
    CRON_SCHEDULES.FREE_GAMES,
    () => checkFreeGames(client),
    { timezone: 'UTC' }
  ));

  activeCrons.set('deals', cron.schedule(
    CRON_SCHEDULES.DEALS,
    () => checkDeals(client),
    { timezone: 'UTC' }
  ));

  activeCrons.set('wishlists', cron.schedule(
    CRON_SCHEDULES.WISHLISTS,
    () => checkWishlists(client),
    { timezone: 'UTC' }
  ));

  activeCrons.set('cleanup', cron.schedule(
    CRON_SCHEDULES.CLEANUP,
    () => cleanupStaleData(),
    { timezone: 'UTC' }
  ));

  activeCrons.set('rates', cron.schedule(
    CRON_SCHEDULES.RATES,
    () => getUSDtoINR(),
    { timezone: 'UTC' }
  ));

  logger.cron(`Started ${activeCrons.size} cron jobs`);
}

export function stopCrons() {
  for (const [name, job] of activeCrons) {
    job.stop();
    logger.cron(`Stopped cron: ${name}`);
  }
  activeCrons.clear();
}

export function getCronStatus() {
  return [...activeCrons.entries()].map(([name, job]) => ({
    name,
    running: job.status === 'running',
  }));
}
