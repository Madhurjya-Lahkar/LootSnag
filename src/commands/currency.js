import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setUserCurrency, ensureUser } from '../database/models/user.js';
import { setGuildCurrency, ensureGuild } from '../database/models/guild.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay } from '../utils/cv2.js';

export const data = new SlashCommandBuilder()
  .setName('currency')
  .setDescription('Set preferred display currency')
  .addStringOption(opt =>
    opt.setName('currency')
      .setDescription('Currency to display prices in')
      .setRequired(true)
      .addChoices(
        { name: 'Indian Rupee (₹ INR)', value: 'INR' },
        { name: 'US Dollar ($ USD)',     value: 'USD' },
      )
  )
  .addBooleanOption(opt =>
    opt.setName('server')
      .setDescription('Apply to the whole server (requires Manage Server)')
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const currency  = interaction.options.getString('currency');
  const forServer = interaction.options.getBoolean('server') ?? false;
  const userId    = interaction.user.id;
  const guildId   = interaction.guildId;

  await ensureUser(userId);

  if (forServer) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.editReply({ content: 'You need **Manage Server** permission to change server currency.' });
    }
    if (guildId) {
      await ensureGuild(guildId);
      await setGuildCurrency(guildId, currency);
    }
  }

  await setUserCurrency(userId, currency);

  const symbol  = currency === 'INR' ? '₹' : '$';
  const payload = {
    components: [
      container(
        Colors.success,
        textDisplay(`# ${E.currency} CURRENCY UPDATED\nPrices will now display in **${symbol} ${currency}**${forServer ? ' for this server' : ''}.`)
      ),
    ],
  };
  return followUpCV2(interaction, payload);
}
