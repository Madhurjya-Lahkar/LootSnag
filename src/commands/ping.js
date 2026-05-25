import { SlashCommandBuilder } from 'discord.js';
import { followUpCV2 } from '../utils/cv2.js';
import Colors from '../config/colors.js';
import E from '../config/emojis.js';
import { container, textDisplay, separator } from '../utils/cv2.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency');

export async function execute(interaction) {
  const sent = Date.now();
  await interaction.deferReply({ ephemeral: true });
  const roundtrip = Date.now() - sent;
  const wsLatency = interaction.client.ws.ping;

  const payload = {
    components: [
      container(
        wsLatency < 100 ? Colors.success : wsLatency < 250 ? Colors.warn : Colors.error,
        textDisplay(`# ${E.ping} PONG`),
        separator(true, 1),
        textDisplay(
          `**API Latency:** ${roundtrip}ms\n**WebSocket:** ${wsLatency}ms`
        )
      ),
    ],
  };

  await followUpCV2(interaction, payload);
}
