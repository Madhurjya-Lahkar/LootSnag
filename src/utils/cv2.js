import { Routes } from 'discord.js';
import { CV2_FLAG } from '../config/constants.js';
import logger from './logger.js';

export async function sendCV2(client, channelId, payload) {
  try {
    return await client.rest.post(
      Routes.channelMessages(channelId),
      { body: { ...payload, flags: CV2_FLAG } }
    );
  } catch (err) {
    logger.error(`sendCV2 failed for channel ${channelId}`, err);
    throw err;
  }
}

export async function editCV2(client, channelId, messageId, payload) {
  try {
    return await client.rest.patch(
      Routes.channelMessage(channelId, messageId),
      { body: { ...payload, flags: CV2_FLAG } }
    );
  } catch (err) {
    logger.error(`editCV2 failed for message ${messageId}`, err);
    throw err;
  }
}

export async function replyCV2(interaction, payload) {
  try {
    await interaction.client.rest.post(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        body: {
          type: 4,
          data: { ...payload, flags: CV2_FLAG },
        },
      }
    );
  } catch (err) {
    logger.error('replyCV2 failed', err);
    throw err;
  }
}

export async function followUpCV2(interaction, payload) {
  try {
    await interaction.client.rest.patch(
      Routes.webhookMessage(interaction.client.user.id, interaction.token),
      { body: { ...payload, flags: CV2_FLAG } }
    );
  } catch (err) {
    logger.error('followUpCV2 failed', err);
    throw err;
  }
}

export function container(accentColor, ...children) {
  return {
    type: 17,
    accent_color: accentColor,
    components: children.filter(Boolean),
  };
}

export function textDisplay(content) {
  return { type: 10, content };
}

export function separator(divider = true, spacing = 1) {
  return { type: 14, divider, spacing };
}

export function mediaGallery(imageUrl, altText = '') {
  if (!imageUrl) return null;
  return {
    type: 12,
    items: [{ media: { url: imageUrl }, description: altText }],
  };
}

export function actionRow(...buttons) {
  return { type: 1, components: buttons };
}

export function linkButton(label, url) {
  return { type: 2, style: 5, label, url };
}

export function secondaryButton(label, customId) {
  return { type: 2, style: 2, label, custom_id: customId };
}

export function dangerButton(label, customId) {
  return { type: 2, style: 4, label, custom_id: customId };
}

export function primaryButton(label, customId) {
  return { type: 2, style: 1, label, custom_id: customId };
}
