import { query, queryOne } from '../connection.js';
import { DEFAULT } from '../../config/constants.js';

export async function getUser(userId) {
  return queryOne('SELECT * FROM users WHERE id = ?', [userId]);
}

export async function ensureUser(userId) {
  await query('INSERT IGNORE INTO users (id) VALUES (?)', [userId]);
  return getUser(userId);
}

export async function setUserCurrency(userId, currency) {
  await ensureUser(userId);
  await query('UPDATE users SET currency = ? WHERE id = ?', [currency, userId]);
}

export async function setAlertMethod(userId, method) {
  await ensureUser(userId);
  await query('UPDATE users SET alert_method = ? WHERE id = ?', [method, userId]);
}

export async function getUserCurrency(userId) {
  const user = await getUser(userId);
  return user?.currency ?? DEFAULT.CURRENCY;
}

export async function getUserAlertMethod(userId) {
  const user = await getUser(userId);
  return user?.alert_method ?? 'channel';
}
