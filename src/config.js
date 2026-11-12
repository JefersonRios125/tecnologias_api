function required(name, minimumLength = 1) {
  const value = process.env[name];
  if (!value || value.trim().length < minimumLength || value.startsWith('substitua-')) {
    throw new Error(`Configure ${name} no .env (mínimo de ${minimumLength} caracteres).`);
  }
  return value;
}

export function loadConfig() {
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser uma porta válida.');
  }

  return {
    port,
    host: process.env.HOST ?? '127.0.0.1',
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    mongoUri: required('MONGODB_URI'),
    mongoDatabase: process.env.MONGODB_DATABASE ?? 'catalogo_tecnologias',
    jwtSecret: required('JWT_SECRET', 32),
    adminUser: required('ADMIN_USER'),
    adminPassword: required('ADMIN_PASSWORD', 12),
  };
}
