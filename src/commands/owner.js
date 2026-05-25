import { SlashCommandBuilder } from 'discord.js';
import { cache } from '../utils/cache.js';
import { followUpCV2 } from '../utils/cv2.js';
import { getStats, incrementStat } from '../database/models/deals.js';
import { setChannel, getGuild } from '../database/models/guild.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';
import logger from '../utils/logger.js';
import 'dotenv/config';

export const data = new SlashCommandBuilder()
  .setName('owner')
  .setDescription('Owner-only management commands')
  .addSubcommand(sub =>
    sub.setName('reload')
      .setDescription('Reload slash commands globally')
  )
  .addSubcommand(sub =>
    sub.setName('logs')
      .setDescription('Set the log channel')
      .addChannelOption(opt =>
        opt.setName('channel')
          .setDescription('Channel to send bot logs to')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('cache')
      .setDescription('Manage the bot cache')
      .addStringOption(opt =>
        opt.setName('action')
          .setDescription('Cache action')
          .setRequired(true)
          .addChoices(
            { name: 'Clear all',  value: 'clear' },
            { name: 'View stats', value: 'stats' },
          )
      )
  )
  .addSubcommand(sub =>
    sub.setName('cron')
      .setDescription('Run a cron job manually')
      .addStringOption(opt =>
        opt.setName('job')
          .setDescription('Which job to run')
          .setRequired(true)
          .addChoices(
            { name: 'Free Games', value: 'freegames' },
            { name: 'Deals',      value: 'deals' },
            { name: 'Wishlists',  value: 'wishlists' },
            { name: 'Cleanup',    value: 'cleanup' },
          )
      )
  )
  .addSubcommand(sub =>
    sub.setName('config')
      .setDescription('View current bot configuration')
  );

export async function execute(interaction) {
  if (interaction.user.id !== process.env.OWNER_ID) {
    return interaction.reply({ content: 'This command is restricted to the bot owner.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const sub = interaction.options.getSubcommand();

  if (sub === 'reload') {
    try {
      const { loadCommands, deployCommands } = await import('../handlers/commandHandler.js');
      await loadCommands(interaction.client);
      await deployCommands(interaction.client);
      return followUpCV2(interaction, {
        components: [container(Colors.success, textDisplay(`# ${E.check} COMMANDS RELOADED\nAll slash commands have been re-registered.`))],
      });
    } catch (err) {
      logger.error('Command reload failed', err);
      return interaction.editReply({ content: `Reload failed: ${err.message}` });
    }
  }

  if (sub === 'logs') {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;
    if (guildId) await setChannel(guildId, 'logs', channel.id);
    process.env.LOG_CHANNEL_ID = channel.id;

    return followUpCV2(interaction, {
      components: [container(Colors.success, textDisplay(`# ${E.log} LOG CHANNEL SET\nLogs will now be sent to ${channel}.`))],
    });
  }

  if (sub === 'cache') {
    const action = interaction.options.getString('action');
    if (action === 'clear') {
      cache.clear();
      return followUpCV2(interaction, {
        components: [container(Colors.success, textDisplay(`# ${E.cache} CACHE CLEARED\nAll cached data has been purged.`))],
      });
    }
    if (action === 'stats') {
      return followUpCV2(interaction, {
        components: [container(Colors.info,
          textDisplay(`# ${E.cache} CACHE STATS`),
          separator(true, 1),
          textDisplay(`**Cached entries:** ${cache.size()}`)
        )],
      });
    }
  }

  if (sub === 'cron') {
    const job = interaction.options.getString('job');
    const client = interaction.client;

    await followUpCV2(interaction, {
      components: [container(Colors.info, textDisplay(`# ${E.cron} Running **${job}** cron...`))],
    });

    try {
      if (job === 'freegames') {
        const { checkFreeGames } = await import('../cron/freeGames.js');
        await checkFreeGames(client);
      } else if (job === 'deals') {
        const { checkDeals } = await import('../cron/deals.js');
        await checkDeals(client);
      } else if (job === 'wishlists') {
        const { checkWishlists } = await import('../cron/wishlist.js');
        await checkWishlists(client);
      } else if (job === 'cleanup') {
        const { cleanupStaleData } = await import('../cron/cleanup.js');
        await cleanupStaleData();
      }

      await interaction.followUp({ content: `${E.check} **${job}** cron completed.`, ephemeral: true });
    } catch (err) {
      logger.error(`Manual cron ${job} failed`, err);
      await interaction.followUp({ content: `Cron failed: ${err.message}`, ephemeral: true });
    }
    return;
  }

  if (sub === 'config') {
    const lines = [
      `**Bot ID:** ${interaction.client.user.id}`,
      `**Owner ID:** ${process.env.OWNER_ID}`,
      `**Log Channel:** ${process.env.LOG_CHANNEL_ID ? `<#${process.env.LOG_CHANNEL_ID}>` : '*Not set*'}`,
      `**Default Threshold:** ${process.env.DEFAULT_DEAL_THRESHOLD ?? 80}%`,
      `**Default Currency:** ${process.env.DEFAULT_CURRENCY ?? 'INR'}`,
      `**DB:** ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      `**RAWG Key:** ${process.env.RAWG_API_KEY ? '*Set*' : '*Not set*'}`,
      `**Node:** ${process.version}`,
    ];

    return followUpCV2(interaction, {
      components: [
        container(
          Colors.info,
          textDisplay(`# ${E.owner} BOT CONFIG`),
          separator(true, 1),
          textDisplay(lines.join('\n'))
        ),
      ],
    });
  }
}
