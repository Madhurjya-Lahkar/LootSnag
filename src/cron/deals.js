import { getTopDeals } from '../services/cheapshark.js';
import { resolveGameImage } from '../services/imageService.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import { buildDealMessage } from '../embeds/dealEmbed.js';
import { sendCV2, editCV2 } from '../utils/cv2.js';
import { getAllGuilds, getGuildThreshold } from '../database/models/guild.js';
import { wasDealSent, recordDeal, incrementStat } from '../database/models/deals.js';
import { saveMessageMap, getMessageMap } from '../database/models/messages.js';
import logger from '../utils/logger.js';

export async function checkDeals(client) {
  logger.cron('Deals check started');

  try {
    const guilds       = await getAllGuilds();
    const exchangeRate = await getUSDtoINR();
    const thresholds   = [...new Set(guilds.map(g => g.deal_threshold ?? 80))];

    for (const threshold of thresholds) {
      const deals = await getTopDeals(threshold);

      const guildsWithThreshold = guilds.filter(
        g => (g.deal_threshold ?? 80) === threshold && g.deals_channel
      );

      for (const deal of deals) {
        const alreadySent = await wasDealSent(deal.dealId);

        if (!alreadySent) {
          deal.imageUrl = await resolveGameImage(deal.steamAppId, null, deal.title);
          await recordDeal(
            deal.dealId, deal.title, deal.store,
            deal.salePrice, deal.normalPrice, Math.round(deal.savings), 'deal', null
          );
        }

        for (const guild of guildsWithThreshold) {
          const currency = guild.currency || 'INR';
          const payload  = buildDealMessage(deal, currency, exchangeRate, deal.imageUrl);
          const existing = await getMessageMap(deal.dealId, guild.id);

          try {
            if (existing) {
              await editCV2(client, existing.channel_id, existing.message_id, payload);
            } else if (!alreadySent) {
              const sent = await sendCV2(client, guild.deals_channel, payload);
              await saveMessageMap(deal.dealId, guild.id, guild.deals_channel, sent.id, 'deal');
              await incrementStat('deals_sent');
            }
          } catch (err) {
            logger.error(`Failed to post deal "${deal.title}" to guild ${guild.id}`, err.message);
          }
        }
      }
    }

    logger.cron('Deals check complete');
  } catch (err) {
    logger.error('Deals cron failed', err);
  }
}
