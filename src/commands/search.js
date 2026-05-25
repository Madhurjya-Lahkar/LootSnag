import { SlashCommandBuilder } from 'discord.js';
import { searchGames } from '../services/cheapshark.js';
import { resolveGameImage, getSteamImage } from '../services/imageService.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import { buildSearchMessage } from '../embeds/searchEmbed.js';
import { getUserCurrency } from '../database/models/user.js';
import { replyCV2, followUpCV2 } from '../utils/cv2.js';
import { incrementStat } from '../database/models/deals.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('search')
  .setDescription('Search for game prices across all stores')
  .addStringOption(opt =>
    opt.setName('game')
      .setDescription('Game name to search')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const gameName    = interaction.options.getString('game');
  const userId      = interaction.user.id;
  const currency    = await getUserCurrency(userId);
  const exchangeRate = await getUSDtoINR();

  try {
    const results = await searchGames(gameName);

    if (results.length > 0 && results[0].steamAppId) {
      results[0].imageUrl = getSteamImage(results[0].steamAppId);
    } else if (results.length > 0) {
      results[0].imageUrl = await resolveGameImage(null, null, results[0].title);
    }

    const payload = buildSearchMessage(results, gameName, currency, exchangeRate);
    await followUpCV2(interaction, payload);
    await incrementStat('searches_performed');
  } catch (err) {
    logger.error('Search command failed', err);
    await interaction.editReply({ content: 'Search failed. Please try again.' });
  }
}
