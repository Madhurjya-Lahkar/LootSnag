import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function deploy() {
  const commandsPath = join(__dirname, 'src', 'commands');
  const files        = readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  const commands     = [];

  for (const file of files) {
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const mod      = await import(filePath);
    if (mod.data) {
      commands.push(mod.data.toJSON());
      console.log(`  Loaded: /${mod.data.name}`);
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  console.log(`\nDeploying ${commands.length} commands...`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log(`Done. Commands registered globally.`);
}

deploy().catch(console.error);
