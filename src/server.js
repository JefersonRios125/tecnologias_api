import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './database.js';

try {
  const config = loadConfig();
  const { client, db } = await openDatabase(config.mongoUri, config.mongoDatabase);
  const server = createApp(config, db).listen(config.port, config.host, () => {
    console.log(`API disponível em http://${config.host}:${config.port}`);
  });

  server.on('error', async (error) => {
    console.error(`Não foi possível abrir a porta da API (${error.code ?? error.name}).`);
    process.exitCode = 1;
    await client.close();
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close(() => client.close()));
  }
} catch (error) {
  console.error(error.message.startsWith('Configure ') || error.message.startsWith('PORT ')
    ? error.message
    : `Não foi possível conectar ao MongoDB (${error.name}). Confira o .env e a conexão com o banco.`);
  process.exitCode = 1;
}
