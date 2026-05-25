import 'dotenv/config';

const LOG_LEVEL = {
  INFO:  '\x1b[36mINFO\x1b[0m',
  WARN:  '\x1b[33mWARN\x1b[0m',
  ERROR: '\x1b[31mERROR\x1b[0m',
  CRON:  '\x1b[35mCRON\x1b[0m',
  DB:    '\x1b[34mDB\x1b[0m',
  API:   '\x1b[32mAPI\x1b[0m',
};

function timestamp() {
  return new Date().toISOString();
}

function log(level, message, meta) {
  const base = `[${timestamp()}] [${LOG_LEVEL[level]}] ${message}`;
  if (meta) {
    console.log(base, meta);
  } else {
    console.log(base);
  }
}

let _client = null;

export function setLogClient(client) {
  _client = client;
}

async function sendToLogChannel(content) {
  if (!_client) return;
  const channelId = process.env.LOG_CHANNEL_ID;
  if (!channelId) return;
  try {
    const channel = await _client.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return;
    await channel.send({ content: `\`\`\`\n${content}\n\`\`\`` });
  } catch {}
}

const logger = {
  info(message, meta) {
    log('INFO', message, meta);
  },
  warn(message, meta) {
    log('WARN', message, meta);
    sendToLogChannel(`[WARN] ${message}${meta ? '\n' + JSON.stringify(meta) : ''}`);
  },
  error(message, meta) {
    log('ERROR', message, meta);
    sendToLogChannel(`[ERROR] ${message}${meta ? '\n' + (meta?.stack || JSON.stringify(meta)) : ''}`);
  },
  cron(message, meta) {
    log('CRON', message, meta);
  },
  db(message, meta) {
    log('DB', message, meta);
  },
  api(message, meta) {
    log('API', message, meta);
  },
};

export default logger;
