import { query, queryOne } from '../connection.js';

export async function wasDealSent(dealId) {
  const row = await queryOne(
    'SELECT id FROM sent_deals WHERE deal_id = ?',
    [dealId]
  );
  return !!row;
}

export async function recordDeal(dealId, title, store, salePrice, normalPrice, discount, type, expiresAt) {
  await query(
    `INSERT IGNORE INTO sent_deals
     (deal_id, game_title, store, sale_price, normal_price, discount, deal_type, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [dealId, title, store, salePrice, normalPrice, discount, type, expiresAt || null]
  );
}

export async function cleanupExpired() {
  await query(
    `DELETE FROM sent_deals
     WHERE expires_at IS NOT NULL AND expires_at < NOW()`,
    []
  );
}

export async function incrementStat(key) {
  await query(
    `INSERT INTO bot_stats (stat_key, stat_value) VALUES (?, 1)
     ON DUPLICATE KEY UPDATE stat_value = stat_value + 1`,
    [key]
  );
}

export async function getStats() {
  return query('SELECT stat_key, stat_value FROM bot_stats');
}
