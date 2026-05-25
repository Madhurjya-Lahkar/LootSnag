import { SlashCommandBuilder } from 'discord.js';
import {
  addToWishlist, removeFromWishlist,
  getUserWishlist, isInWishlist,
} from '../database/models/wishlist.js';
import { ensureUser } from '../database/models/user.js';
import { buildWishlistListMessage } from '../embeds/wishlistEmbed.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('wishlist')
  .setDescription('Manage your game wishlist')
  .addSubcommand(sub =>
    sub.setName('add')
      .setDescription('Add a game to your wishlist')
      .addStringOption(opt =>
        opt.setName('game')
          .setDescription('Game name to add')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('store')
          .setDescription('Preferred store (optional)')
      )
  )
  .addSubcommand(sub =>
    sub.setName('remove')
      .setDescription('Remove a game from your wishlist')
      .addStringOption(opt =>
        opt.setName('game')
          .setDescription('Game name to remove')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('list')
      .setDescription('View your wishlist')
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const sub    = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  await ensureUser(userId);

  try {
    if (sub === 'add') {
      const gameName = interaction.options.getString('game');
      const store    = interaction.options.getString('store') || null;
      const gameId   = `manual_${gameName.toLowerCase().replace(/\s+/g, '_').slice(0, 80)}`;

      const already = await isInWishlist(userId, gameId);
      if (already) {
        return interaction.editReply({ content: `**${gameName}** is already in your wishlist.` });
      }

      await addToWishlist(userId, gameId, gameName, store, null);

      const payload = {
        components: [
          container(
            Colors.wishlist,
            textDisplay(`# ${E.check} ADDED TO WISHLIST`),
            separator(true, 1),
            textDisplay(`**${gameName}** has been added.\nYou'll be alerted when it goes on sale.`)
          ),
        ],
      };
      return followUpCV2(interaction, payload);
    }

    if (sub === 'remove') {
      const gameName = interaction.options.getString('game');
      const gameId   = `manual_${gameName.toLowerCase().replace(/\s+/g, '_').slice(0, 80)}`;
      const removed  = await removeFromWishlist(userId, gameId);

      const payload = {
        components: [
          container(
            removed ? Colors.success : Colors.info,
            textDisplay(
              removed
                ? `# ${E.check} REMOVED\n**${gameName}** removed from your wishlist.`
                : `# ${E.cross} NOT FOUND\n**${gameName}** was not in your wishlist.`
            )
          ),
        ],
      };
      return followUpCV2(interaction, payload);
    }

    if (sub === 'list') {
      const items   = await getUserWishlist(userId);
      const payload = buildWishlistListMessage(items, interaction.user.username);
      return followUpCV2(interaction, payload);
    }

  } catch (err) {
    logger.error('wishlist command failed', err);
    await interaction.editReply({ content: err.message || 'Wishlist operation failed.' });
  }
}
