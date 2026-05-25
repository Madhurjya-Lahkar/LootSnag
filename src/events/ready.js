import { ActivityType } from 'discord.js';
import { setLogClient } from '../utils/logger.js';
import { startCrons } from '../handlers/cronHandler.js';
import { deployCommands } from '../handlers/commandHandler.js';
import { testConnection } from '../database/connection.js';
import { checkFreeGames } from '../cron/freeGames.js';
import logger from '../utils/logger.js';

export const name  = 'ready';
export const once  = true;

export async function execute(client) {
  setLogClient(client);

  logger.info(`Logged in as ${client.user.tag}`);
  logger.info(`Serving ${client.guilds.cache.size} guilds`);

 
  try {
    await testConnection();
    logger.db('Database connection verified');
  } catch (err) {
    logger.error('Database connection failed on ready', err);
  }

  try {
    await deployCommands(client);
  } catch (err) {
    logger.error('Command deployment failed on startup', err);
  }

  client.user.setPresence({
    activities: [{
      name:  'loot & deals',
      type:  ActivityType.Watching,
    }],
    status: 'online',
  });

  startCrons(client);

  setTimeout(() => checkFreeGames(client), 5000);
}
