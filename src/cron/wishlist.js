import { getFreeDeals, getTopDeals } from '../services/cheapshark.js';
import { getEpicFreeGames } from '../services/epic.js';
import { resolveGameImage } from '../services/imageService.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import { buildWishlistAlertMessage } from '../embeds/wishlistEmbed.js';
import { sendCV2 } from '../utils/cv2.js';
import { getUsersByGameInWishlist, getUserWishlist } from '../database/models/wishlist.js';
import { wasWishlistAlertSent, recordWishlistAlert, incrementStat } from '../database/models/messages.js';
import { getUser } from '../database/models/user.js';
import { getGuild } from '../database/models/guild.js';
import logger from '../utils/logger.js';

export async function checkWishlists(client) {
  logger.cron('Wishlist check started');

  try {
    const [freeDeals, topDeals, epicData, exchangeRate] = await Promise.all([
      getFreeDeals(),
      getTopDeals(50),
      getEpicFreeGames(),
      getUSDtoINR(),
    ]);

    const allDeals = [
      ...freeDeals,
      ...topDeals,
      ...epicData.current,
    ];

    for (const deal of allDeals) {
      const normalizedTitle = deal.title.toLowerCase().trim();

      const wishlistUsers = await getUsersByGameInWishlist(deal.gameId);

      for (const { user_id } of wishlistUsers) {
        const alreadySent = await wasWishlistAlertSent(user_id, deal.dealId);
        if (alreadySent) continue;

        const user     = await getUser(user_id);
        const currency = user?.currency || 'INR';
        const method   = user?.alert_method || 'channel';

        const imageUrl = deal.imageUrl || await resolveGameImage(deal.steamAppId, null, deal.title);
        const gameItem = { game_title: deal.title, store: deal.store, game_id: deal.gameId };
        const payload  = buildWishlistAlertMessage(gameItem, deal, currency, exchangeRate, imageUrl);

        let sent = false;

        if (method === 'dm' || method === 'both') {
          try {
            const discordUser = await client.users.fetch(user_id).catch(() => null);
            if (discordUser) {
              const dmChannel = await discordUser.createDM();
              await sendCV2(client, dmChannel.id, payload);
              sent = true;
            }
          } catch (err) {
            logger.warn(`Failed to DM wishlist alert to user ${user_id}`, err.message);
          }
        }

        if (method === 'channel' || method === 'both') {
          const guilds = await client.guilds.fetch().catch(() => new Map());
          for (const [guildId] of guilds) {
            const member = await client.guilds.cache.get(guildId)?.members.fetch(user_id).catch(() => null);
            if (!member) continue;
            const guildData = await getGuild(guildId);
            if (!guildData?.wishlist_channel) continue;
            try {
              await sendCV2(client, guildData.wishlist_channel, payload);
              sent = true;
            } catch {}
          }
        }

        if (sent) {
          await recordWishlistAlert(user_id, deal.gameId, deal.dealId);
          await incrementStat('wishlist_alerts_sent');
        }
      }
    }

    logger.cron('Wishlist check complete');
  } catch (err) {
    logger.error('Wishlist cron failed', err);
  }
}
