import { ensureGuild } from '../database/models/guild.js';
import logger from '../utils/logger.js';

export const name = 'guildCreate';

export async function execute(guild) {
  try {
    await ensureGuild(guild.id);
    logger.info(`Joined new guild: ${guild.name} (${guild.id})`);
  } catch (err) {
    logger.error(`Failed to initialize guild ${guild.id}`, err);
  }
}
