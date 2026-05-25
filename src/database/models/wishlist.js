import { query, queryOne } from '../connection.js';
import { LIMITS } from '../../config/constants.js';

export async function addToWishlist(userId, gameId, gameTitle, store, storeUrl) {
  const count = await getWishlistCount(userId);
  if (count >= LIMITS.WISHLIST_MAX) {
    throw new Error(`Wishlist limit reached (${LIMITS.WISHLIST_MAX} games max).`);
  }
  await query(
    `INSERT IGNORE INTO wishlists (user_id, game_id, game_title, store, store_url)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, gameId, gameTitle, store, storeUrl]
  );
}

export async function removeFromWishlist(userId, gameId) {
  const result = await query(
    'DELETE FROM wishlists WHERE user_id = ? AND game_id = ?',
    [userId, gameId]
  );
  return result.affectedRows > 0;
}

export async function getUserWishlist(userId) {
  return query(
    'SELECT * FROM wishlists WHERE user_id = ? ORDER BY added_at DESC',
    [userId]
  );
}

export async function getWishlistCount(userId) {
  const row = await queryOne(
    'SELECT COUNT(*) AS cnt FROM wishlists WHERE user_id = ?',
    [userId]
  );
  return Number(row?.cnt ?? 0);
}

export async function isInWishlist(userId, gameId) {
  const row = await queryOne(
    'SELECT id FROM wishlists WHERE user_id = ? AND game_id = ?',
    [userId, gameId]
  );
  return !!row;
}

export async function getUsersByGameInWishlist(gameId) {
  return query(
    'SELECT DISTINCT user_id FROM wishlists WHERE game_id = ?',
    [gameId]
  );
}
