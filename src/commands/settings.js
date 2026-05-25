import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ensureGuild, setThreshold, setGuildCurrency, getGuild } from '../database/models/guild.js';
import { setUserCurrency, setAlertMethod, ensureUser, getUser } from '../database/models/user.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';

export const data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Configure bot settings')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View current settings')
  )
  .addSubcommand(sub =>
    sub.setName('threshold')
      .setDescription('Set minimum deal discount % for alerts')
      .addIntegerOption(opt =>
        opt.setName('percent')
          .setDescription('Minimum discount (1-100)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100)
      )
  )
  .addSubcommand(sub =>
    sub.setName('alertmethod')
      .setDescription('Set your personal wishlist alert method')
      .addStringOption(opt =>
        opt.setName('method')
          .setDescription('How to receive alerts')
          .setRequired(true)
          .addChoices(
            { name: 'DM only',          value: 'dm' },
            { name: 'Channel only',     value: 'channel' },
            { name: 'Both DM + Channel',value: 'both' },
          )
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const sub    = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const guildId = interaction.guildId;

  await ensureUser(userId);
  if (guildId) await ensureGuild(guildId);

  if (sub === 'view') {
    const [guild, user] = await Promise.all([
      guildId ? getGuild(guildId) : null,
      getUser(userId),
    ]);

    const lines = [
      `**Your Currency:** ${user?.currency || 'INR'}`,
      `**Your Alert Method:** ${user?.alert_method || 'channel'}`,
    ];

    if (guild) {
      lines.push('', `**Server Deal Threshold:** ${guild.deal_threshold ?? 80}% off`);
      lines.push(`**Server Currency:** ${guild.currency || 'INR'}`);
    }

    const payload = {
      components: [
        container(
          Colors.info,
          textDisplay(`# ${E.settings} SETTINGS`),
          separator(true, 1),
          textDisplay(lines.join('\n'))
        ),
      ],
    };
    return followUpCV2(interaction, payload);
  }

  if (sub === 'threshold') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.editReply({ content: 'You need **Manage Server** permission to change this.' });
    }
    const percent = interaction.options.getInteger('percent');
    await setThreshold(guildId, percent);
    const payload = {
      components: [
        container(
          Colors.success,
          textDisplay(`# ${E.check} THRESHOLD UPDATED\nDeal alerts will now trigger at **${percent}%** off or more.`)
        ),
      ],
    };
    return followUpCV2(interaction, payload);
  }

  if (sub === 'alertmethod') {
    const method = interaction.options.getString('method');
    await setAlertMethod(userId, method);
    const labels = { dm: 'DM only', channel: 'Channel only', both: 'DM + Channel' };
    const payload = {
      components: [
        container(
          Colors.success,
          textDisplay(`# ${E.check} ALERT METHOD UPDATED\nWishlist alerts will be sent via **${labels[method]}**.`)
        ),
      ],
    };
    return followUpCV2(interaction, payload);
  }
}
