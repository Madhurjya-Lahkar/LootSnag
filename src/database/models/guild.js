import { query, queryOne } from '../connection.js';
import { DEFAULT } from '../../config/constants.js';

export async function getGuild(guildId) {
  return queryOne('SELECT * FROM guilds WHERE id = ?', [guildId]);
}

export async function ensureGuild(guildId) {
  await query(
    'INSERT IGNORE INTO guilds (id) VALUES (?)',
    [guildId]
  );
  return getGuild(guildId);
}

export async function setChannel(guildId, type, channelId) {
  await ensureGuild(guildId);
  const column = `${type}_channel`;
  await query(`UPDATE guilds SET ${column} = ? WHERE id = ?`, [channelId, guildId]);
}

export async function setThreshold(guildId, threshold) {
  await ensureGuild(guildId);
  await query('UPDATE guilds SET deal_threshold = ? WHERE id = ?', [threshold, guildId]);
}

export async function setGuildCurrency(guildId, currency) {
  await ensureGuild(guildId);
  await query('UPDATE guilds SET currency = ? WHERE id = ?', [currency, guildId]);
}

export async function getAllGuilds() {
  return query('SELECT * FROM guilds');
}

export async function getGuildThreshold(guildId) {
  const guild = await getGuild(guildId);
  return guild?.deal_threshold ?? DEFAULT.THRESHOLD;
}

export async function getGuildCurrency(guildId) {
  const guild = await getGuild(guildId);
  return guild?.currency ?? DEFAULT.CURRENCY;
}
