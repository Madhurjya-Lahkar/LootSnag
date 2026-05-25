import { SlashCommandBuilder } from 'discord.js';
import { getStats } from '../database/models/deals.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('View LootSnag bot statistics');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const rows    = await getStats();
  const statsMap = Object.fromEntries(rows.map(r => [r.stat_key, Number(r.stat_value)]));

  const lines = [
    `**Free Games Sent:** ${statsMap.free_games_sent ?? 0}`,
    `**Deals Sent:** ${statsMap.deals_sent ?? 0}`,
    `**Wishlist Alerts:** ${statsMap.wishlist_alerts_sent ?? 0}`,
    `**Searches:** ${statsMap.searches_performed ?? 0}`,
    `**Commands Used:** ${statsMap.commands_used ?? 0}`,
    '',
    `**Servers:** ${interaction.client.guilds.cache.size}`,
    `**Uptime:** ${formatUptime(process.uptime())}`,
  ];

  const payload = {
    components: [
      container(
        Colors.accent,
        textDisplay(`# ${E.stats} BOT STATS`),
        separator(true, 1),
        textDisplay(lines.join('\n'))
      ),
    ],
  };

  await followUpCV2(interaction, payload);
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}
