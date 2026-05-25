import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { REST, Routes } from 'discord.js';
import logger from '../utils/logger.js';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));


export async function loadCommands(client) {
  client.commands = client.commands || new Map();
  client.commands.clear();

  const commandsPath = join(__dirname, '..', 'commands');
  const files        = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const mod      = await import(`${filePath}?t=${Date.now()}`);

    if (!mod.data || !mod.execute) {
      logger.warn(`Command file ${file} missing data or execute export`);
      continue;
    }

    client.commands.set(mod.data.name, mod);
    logger.info(`Loaded command: /${mod.data.name}`);
  }

  logger.info(`${client.commands.size} commands loaded into memory`);
}


export async function deployCommands(client) {
  if (!client.commands?.size) {
    logger.warn('deployCommands called but no commands are loaded');
    return;
  }

  const commandData = [...client.commands.values()].map(mod => mod.data.toJSON());

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandData }
    );
    logger.info(`✓ ${commandData.length} slash commands registered globally`);
  } catch (err) {
    logger.error('Failed to register commands with Discord', err);
    throw err;
  }
}
