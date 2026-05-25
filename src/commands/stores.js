import { SlashCommandBuilder } from 'discord.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';

const STORE_INFO = [
  { name: 'Steam',        source: 'CheapShark API (free)',  note: 'Free weekends + 100% off deals' },
  { name: 'Epic Games',   source: 'Epic Store API (free)',  note: 'Weekly free claim games' },
  { name: 'GOG',          source: 'CheapShark API (free)',  note: 'DRM-free deals' },
  { name: 'Humble Bundle',source: 'CheapShark API (free)',  note: 'Bundle and store deals' },
  { name: 'Fanatical',    source: 'CheapShark API (free)',  note: 'Discount deals' },
  { name: 'Ubisoft',      source: 'CheapShark API (free)',  note: 'Ubisoft Connect deals' },
  { name: 'itch.io',      source: 'CheapShark API (free)',  note: 'Indie game deals' },
];

export const data = new SlashCommandBuilder()
  .setName('stores')
  .setDescription('View all supported stores and their data sources');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const lines = STORE_INFO.map(s =>
    `**${s.name}**\n› ${s.note}\n› *Source: ${s.source}*`
  );

  const payload = {
    components: [
      container(
        Colors.accent,
        textDisplay(`# ${E.store} SUPPORTED STORES`),
        separator(true, 1),
        textDisplay(lines.join('\n\n'))
      ),
    ],
  };

  await followUpCV2(interaction, payload);
}
