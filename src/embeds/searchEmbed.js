import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import {
  container, textDisplay, separator, mediaGallery,
  actionRow, linkButton,
} from '../utils/cv2.js';
import { formatPrice, formatStrikePrice, formatDiscount, truncate } from '../utils/formatter.js';

export function buildSearchMessage(results, query, currency = 'INR', exchangeRate = 84) {
  if (!results || results.length === 0) {
    return {
      components: [
        container(
          Colors.info,
          textDisplay(`# ${E.search} SEARCH RESULTS`),
          separator(true, 1),
          textDisplay(`No results found for **${truncate(query, 60)}**.\nTry a different game name or check spelling.`)
        ),
      ],
    };
  }

  const game        = results[0];
  const cheapest    = game.cheapestDeal;
  const dealsText   = game.deals
    .slice(0, 5)
    .map(d => {
      const price    = formatPrice(d.salePrice, currency, exchangeRate);
      const original = parseFloat(d.normalPrice) > parseFloat(d.salePrice)
        ? `  ${formatStrikePrice(d.normalPrice, currency, exchangeRate)}`
        : '';
      const disc     = parseFloat(d.savings) > 0
        ? `  **-${formatDiscount(d.savings)}**`
        : '';
      const isFree   = parseFloat(d.salePrice) === 0 ? '  🆓' : '';
      return `**${d.storeName}** — ${price}${original}${disc}${isFree}`;
    })
    .join('\n');

  const cheapestPrice = cheapest
    ? formatPrice(cheapest.salePrice, currency, exchangeRate)
    : 'N/A';

  const buttons = game.deals
    .slice(0, 3)
    .map(d => linkButton(d.storeName, d.url));

  const components = [
    container(
      Colors.search,
      textDisplay(`# ${E.search} SEARCH RESULTS`),
      separator(true, 1),
      textDisplay(
        [
          `### ${game.title}`,
          `**Best Price:** ${cheapestPrice} on ${cheapest?.storeName || 'N/A'}`,
          '',
          '**All Store Prices:**',
          dealsText || 'No prices available.',
        ].join('\n')
      ),
      separator(false, 1),
      buttons.length > 0 ? actionRow(...buttons) : null,
      separator(true, 1),
      mediaGallery(game.imageUrl || null, game.title)
    ),
  ];

  return { components };
}
