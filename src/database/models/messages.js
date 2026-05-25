import { query, queryOne } from '../connection.js';

export async function saveMessageMap(dealId, guildId, channelId, messageId, type) {
  await query(
    `INSERT INTO message_map (deal_id, guild_id, channel_id, message_id, deal_type)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE channel_id = ?, message_id = ?`,
    [dealId, guildId, channelId, messageId, type, channelId, messageId]
  );
}

export async function getMessageMap(dealId, guildId) {
  return queryOne(
    'SELECT * FROM message_map WHERE deal_id = ? AND guild_id = ?',
    [dealId, guildId]
  );
}

export async function getMessagesByDeal(dealId) {
  return query(
    'SELECT * FROM message_map WHERE deal_id = ?',
    [dealId]
  );
}

export async function deleteMessageMap(dealId, guildId) {
  await query(
    'DELETE FROM message_map WHERE deal_id = ? AND guild_id = ?',
    [dealId, guildId]
  );
}

export async function wasWishlistAlertSent(userId, dealId) {
  const row = await queryOne(
    'SELECT id FROM wishlist_alerts WHERE user_id = ? AND deal_id = ?',
    [userId, dealId]
  );
  return !!row;
}

export async function recordWishlistAlert(userId, gameId, dealId) {
  await query(
    'INSERT IGNORE INTO wishlist_alerts (user_id, game_id, deal_id) VALUES (?, ?, ?)',
    [userId, gameId, dealId]
  );
}
