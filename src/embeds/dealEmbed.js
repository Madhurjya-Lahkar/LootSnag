import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import {
  container, textDisplay, separator, mediaGallery,
  actionRow, linkButton, secondaryButton,
} from '../utils/cv2.js';
import { formatPrice, formatStrikePrice, formatDiscount, safeCustomId } from '../utils/formatter.js';

export function buildDealMessage(deal, currency = 'INR', exchangeRate = 84, imageUrl = null) {
  const saleFormatted   = formatPrice(deal.salePrice, currency, exchangeRate);
  const normalFormatted = formatStrikePrice(deal.normalPrice, currency, exchangeRate);
  const discountStr     = formatDiscount(deal.savings);

  const addId = safeCustomId('wl_add', deal.gameId || deal.dealId);

  const components = [
    container(
      Colors.deal,
      textDisplay(`# ${E.deal} DEAL ALERT`),
      separator(true, 1),
      textDisplay(
        [
          `### ${deal.title}`,
          `**Platform:** ${deal.store}`,
          `**Price:** ${saleFormatted}  ${normalFormatted}`,
          `**Discount:** ${discountStr} OFF`,
        ].join('\n')
      ),
      separator(false, 1),
      actionRow(
        linkButton(`Open Deal`, deal.url),
        secondaryButton(`${E.wishlist} Add Wishlist`, addId)
      ),
      separator(true, 1),
      mediaGallery(imageUrl, deal.title)
    ),
  ];

  return { components };
}
