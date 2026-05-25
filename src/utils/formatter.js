export function formatPrice(usdPrice, currency, exchangeRate) {
  const num = parseFloat(usdPrice);
  if (isNaN(num)) return currency === 'INR' ? '₹0' : '$0.00';

  if (currency === 'INR') {
    const inr = Math.round(num * exchangeRate);
    return `₹${inr.toLocaleString('en-IN')}`;
  }

  return `$${num.toFixed(2)}`;
}

export function formatStrikePrice(usdPrice, currency, exchangeRate) {
  const formatted = formatPrice(usdPrice, currency, exchangeRate);
  return `~~${formatted}~~`;
}

export function formatDiscount(savings) {
  return `${Math.round(parseFloat(savings))}%`;
}

export function formatEndsIn(endDateStr) {
  if (!endDateStr) return 'Limited time';
  const end = new Date(endDateStr);
  const now = new Date();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Less than 1h';
}

export function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

export function safeCustomId(prefix, id) {
  const safe = String(id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  return `${prefix}_${safe}`;
}

export function formatTimestamp(date) {
  return `<t:${Math.floor(new Date(date).getTime() / 1000)}:R>`;
}
