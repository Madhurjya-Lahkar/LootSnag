import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import {
  container, textDisplay, separator, mediaGallery,
  actionRow, linkButton,
} from '../utils/cv2.js';
import { formatPrice, formatStrikePrice, formatDiscount, truncate, safeCustomId } from '../utils/formatter.js';

export function buildWishlistAlertMessage(game, deal, currency = 'INR', exchangeRate = 84, imageUrl = null) {
  const saleFormatted   = formatPrice(deal.salePrice, currency, exchangeRate);
  const normalFormatted = deal.normalPrice > deal.salePrice
    ? formatStrikePrice(deal.normalPrice, currency, exchangeRate)
    : null;
  const discountStr     = formatDiscount(deal.savings);
  const isFree          = deal.salePrice === 0;

  const components = [
    container(
      Colors.wishlist,
      textDisplay(`# ${E.wishlist} WISHLIST ALERT`),
      separator(true, 1),
      textDisplay(
        [
          `### ${game.game_title}`,
          `**Platform:** ${game.store || deal.store}`,
          `**Price:** ${saleFormatted}${normalFormatted ? `  ${normalFormatted}` : ''}`,
          `**Discount:** ${isFree ? '100% OFF — FREE' : `${discountStr} OFF`}`,
        ].join('\n')
      ),
      separator(false, 1),
      actionRow(
        linkButton(isFree ? `Claim Free on ${deal.store}` : `Open Deal`, deal.url)
      ),
      separator(true, 1),
      mediaGallery(imageUrl, game.game_title)
    ),
  ];

  return { components };
}

export function buildWishlistListMessage(items, username) {
  if (!items || items.length === 0) {
    return {
      components: [
        container(
          Colors.info,
          textDisplay(`# ${E.wishlist} WISHLIST — ${username}`),
          separator(true, 1),
          textDisplay('Your wishlist is empty.\nUse `/wishlist add` to track games.')
        ),
      ],
    };
  }

  const lines = items.map((item, i) => {
    const storeTag = item.store ? ` *(${item.store})*` : '';
    return `**${i + 1}.** ${truncate(item.game_title, 50)}${storeTag}`;
  });

  const chunks = [];
  for (let i = 0; i < lines.length; i += 15) {
    chunks.push(lines.slice(i, i + 15).join('\n'));
  }

  const innerComponents = [
    textDisplay(`# ${E.wishlist} WISHLIST — ${username}`),
    separator(true, 1),
    textDisplay(`**${items.length} game${items.length !== 1 ? 's' : ''} tracked**`),
    separator(false, 1),
    ...chunks.map(chunk => textDisplay(chunk)),
  ];

  return {
    components: [container(Colors.wishlist, ...innerComponents)],
  };
}
