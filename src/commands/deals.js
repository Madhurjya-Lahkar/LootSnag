import { SlashCommandBuilder } from 'discord.js';
import { getTopDeals } from '../services/cheapshark.js';
import { resolveGameImage } from '../services/imageService.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import { buildDealMessage } from '../embeds/dealEmbed.js';
import { getUserCurrency } from '../database/models/user.js';
import { getGuildThreshold } from '../database/models/guild.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('deals')
  .setDescription('Show best current game deals')
  .addIntegerOption(opt =>
    opt.setName('threshold')
      .setDescription('Minimum discount % (default: server setting)')
      .setMinValue(1)
      .setMaxValue(100)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const currency      = await getUserCurrency(interaction.user.id);
  const guildId       = interaction.guildId;
  const guildThresh   = await getGuildThreshold(guildId);
  const threshold     = interaction.options.getInteger('threshold') ?? guildThresh;
  const exchangeRate  = await getUSDtoINR();

  try {
    const deals = await getTopDeals(threshold);

    if (deals.length === 0) {
      const payload = {
        components: [
          container(
            Colors.info,
            textDisplay(`# ${E.deal} DEALS`),
            separator(true, 1),
            textDisplay(`No deals found at **${threshold}%** off or more right now.\nTry a lower threshold.`)
          ),
        ],
      };
      return followUpCV2(interaction, payload);
    }

    const top = deals.slice(0, 3);

    for (let i = 0; i < top.length; i++) {
      const deal     = top[i];
      const imageUrl = await resolveGameImage(deal.steamAppId, null, deal.title);
      const payload  = buildDealMessage(deal, currency, exchangeRate, imageUrl);

      if (i === 0) {
        await followUpCV2(interaction, payload);
      } else {
        await interaction.followUp({ ...payload, flags: 1 << 15 }).catch(() => {});
      }
    }

  } catch (err) {
    logger.error('deals command failed', err);
    await interaction.editReply({ content: 'Failed to fetch deals. Try again.' });
  }
}
