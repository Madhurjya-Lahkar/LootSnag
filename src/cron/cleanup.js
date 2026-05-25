import { cleanupExpired } from '../database/models/deals.js';
import { query } from '../database/connection.js';
import { cache } from '../utils/cache.js';
import logger from '../utils/logger.js';

export async function cleanupStaleData() {
  logger.cron('Cleanup started');

  try {
    await cleanupExpired();

    await query(
      `DELETE FROM wishlist_alerts WHERE sent_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    await query(
      `DELETE FROM message_map
       WHERE deal_id IN (
         SELECT deal_id FROM sent_deals
         WHERE expires_at IS NOT NULL AND expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
       )`
    );

    cache.cleanup();

    logger.cron('Cleanup complete');
  } catch (err) {
    logger.error('Cleanup cron failed', err);
  }
}
