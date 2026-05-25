import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { setChannel, ensureGuild, getGuild } from '../database/models/guild.js';
import { followUpCV2, container, textDisplay, separator } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('channels')
  .setDescription('Configure alert channels for this server')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(sub =>
    sub.setName('set')
      .setDescription('Set a channel for a specific alert type')
      .addStringOption(opt =>
        opt.setName('type')
          .setDescription('Alert type')
          .setRequired(true)
          .addChoices(
            { name: 'Free Games',     value: 'free_games' },
            { name: 'Deals',          value: 'deals' },
            { name: 'Wishlist Alerts',value: 'wishlist' },
            { name: 'Bot Logs',       value: 'logs' },
          )
      )
      .addChannelOption(opt =>
        opt.setName('channel')
          .setDescription('Channel to send alerts to')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View current channel configuration')
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const sub     = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  await ensureGuild(guildId);

  if (sub === 'set') {
    const type    = interaction.options.getString('type');
    const channel = interaction.options.getChannel('channel');
    await setChannel(guildId, type, channel.id);

    const labels = {
      free_games: 'Free Games',
      deals:      'Deals',
      wishlist:   'Wishlist Alerts',
      logs:       'Bot Logs',
    };

    const payload = {
      components: [
        container(
          Colors.success,
          textDisplay(`# ${E.check} CHANNEL SET\n**${labels[type]}** alerts → ${channel}`)
        ),
      ],
    };
    return followUpCV2(interaction, payload);
  }

  if (sub === 'view') {
    const guild = await getGuild(guildId);

    const fmt = (id) => id ? `<#${id}>` : '*Not set*';
    const lines = [
      `**Free Games:** ${fmt(guild?.free_games_channel)}`,
      `**Deals:** ${fmt(guild?.deals_channel)}`,
      `**Wishlist Alerts:** ${fmt(guild?.wishlist_channel)}`,
      `**Bot Logs:** ${fmt(guild?.logs_channel)}`,
    ];

    const payload = {
      components: [
        container(
          Colors.info,
          textDisplay(`# ${E.channel} CHANNEL CONFIG`),
          separator(true, 1),
          textDisplay(lines.join('\n'))
        ),
      ],
    };
    return followUpCV2(interaction, payload);
  }
}
