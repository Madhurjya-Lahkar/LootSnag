import { getEpicFreeGames } from '../services/epic.js';
import { getFreeDeals } from '../services/cheapshark.js';
import { resolveGameImage } from '../services/imageService.js';
import { getUSDtoINR } from '../services/exchangeRate.js';
import { buildFreeGameMessage } from '../embeds/freeGameEmbed.js';
import { sendCV2, editCV2 } from '../utils/cv2.js';
import { getAllGuilds } from '../database/models/guild.js';
import { wasDealSent, recordDeal, incrementStat } from '../database/models/deals.js';
import { saveMessageMap, getMessageMap } from '../database/models/messages.js';
import logger from '../utils/logger.js';

export async function checkFreeGames(client) {
  logger.cron('Free games check started');

  try {
    const [epicData, csDeals, exchangeRate] = await Promise.all([
      getEpicFreeGames(),
      getFreeDeals(),
      getUSDtoINR(),
    ]);

    const freeGames = [
      ...epicData.current,
      ...csDeals,
    ];

    const guilds = await getAllGuilds();

    for (const game of freeGames) {
      const alreadySent = await wasDealSent(game.dealId);

      if (!alreadySent) {
        game.imageUrl = game.imageUrl || await resolveGameImage(game.steamAppId, null, game.title);

        await recordDeal(
          game.dealId, game.title, game.store,
          0, game.normalPrice || 0, 100, 'free', game.endDate || null
        );
      }

      for (const guild of guilds) {
        if (!guild.free_games_channel) continue;
        const currency  = guild.currency || 'INR';
        const payload   = buildFreeGameMessage(game, currency, exchangeRate);
        const existing  = await getMessageMap(game.dealId, guild.id);

        try {
          if (existing) {
            await editCV2(client, existing.channel_id, existing.message_id, payload);
          } else if (!alreadySent) {
            const sent = await sendCV2(client, guild.free_games_channel, payload);
            await saveMessageMap(game.dealId, guild.id, guild.free_games_channel, sent.id, 'free');
            await incrementStat('free_games_sent');
          }
        } catch (err) {
          logger.error(`Failed to post free game "${game.title}" to guild ${guild.id}`, err.message);
        }
      }
    }

    logger.cron(`Free games check complete — ${freeGames.length} games processed`);
  } catch (err) {
    logger.error('Free games cron failed', err);
  }
}
