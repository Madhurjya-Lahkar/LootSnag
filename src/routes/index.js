export function registerRoutes(app, client) {
  app.get('/api/status', (req, res) => {
    res.json({
      online:  client.isReady(),
      uptime:  process.uptime(),
      guilds:  client.guilds.cache.size,
      ping:    client.ws.ping,
    });
  });

  app.get('/api/guilds', async (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id:   g.id,
      name: g.name,
      icon: g.iconURL(),
    }));
    res.json(guilds);
  });
}
