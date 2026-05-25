import { InteractionType } from 'discord.js';
import {
  addToWishlist, removeFromWishlist, isInWishlist,
} from '../database/models/wishlist.js';
import { ensureUser } from '../database/models/user.js';
import { incrementStat } from '../database/models/deals.js';
import { container, textDisplay, followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import logger from '../utils/logger.js';

export const name = 'interactionCreate';

export async function execute(interaction) {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands?.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
      await incrementStat('commands_used').catch(() => {});
    } catch (err) {
      logger.error(`Command /${interaction.commandName} failed`, err);
      const msg = { content: 'Something went wrong. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const { customId } = interaction;

    if (customId.startsWith('wl_add_')) {
      const gameId = customId.slice(7);
      await handleWishlistAdd(interaction, gameId);
      return;
    }

    if (customId.startsWith('wl_rm_')) {
      const gameId = customId.slice(6);
      await handleWishlistRemove(interaction, gameId);
      return;
    }
  }
}

async function handleWishlistAdd(interaction, gameId) {
  await interaction.deferReply({ ephemeral: true });
  const userId = interaction.user.id;
  await ensureUser(userId);

  try {
    const already = await isInWishlist(userId, gameId);
    if (already) {
      return interaction.editReply({ content: 'Already in your wishlist.' });
    }

    const title = deriveTitle(gameId);
    await addToWishlist(userId, gameId, title, null, null);
    await interaction.editReply({ content: `${E.check} **${title}** added to your wishlist.` });
  } catch (err) {
    await interaction.editReply({ content: err.message || 'Failed to add to wishlist.' });
  }
}

async function handleWishlistRemove(interaction, gameId) {
  await interaction.deferReply({ ephemeral: true });
  const userId = interaction.user.id;
  try {
    const removed = await removeFromWishlist(userId, gameId);
    const title = deriveTitle(gameId);
    await interaction.editReply({
      content: removed
        ? `${E.check} **${title}** removed from wishlist.`
        : `${E.cross} **${title}** was not in your wishlist.`,
    });
  } catch (err) {
    await interaction.editReply({ content: err.message || 'Failed to remove from wishlist.' });
  }
}

function deriveTitle(gameId) {
  return gameId
    .replace(/^(epic_|cs_|manual_)/, '')
    .replace(/_/g, ' ')
    .slice(0, 80)
    .replace(/\b\w/g, c => c.toUpperCase());
}
