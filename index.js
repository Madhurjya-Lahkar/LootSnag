import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './src/handlers/commandHandler.js';
import { loadEvents } from './src/handlers/eventHandler.js';
import { testConnection } from './src/database/connection.js';
import logger from './src/utils/logger.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

async function main() {
  logger.info('LootSnag v1.0.0 starting...');

  try {
    await testConnection();
    logger.db('Database connected');
  } catch (err) {
    logger.error('Failed to connect to database. Check DB credentials.', err);
    process.exit(1);
  }

  await loadEvents(client);
  await loadCommands(client); 

  await client.login(process.env.DISCORD_TOKEN);
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

main();
