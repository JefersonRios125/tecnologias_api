import { createHash, timingSafeEqual } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const unidades = new Set(['dias', 'semanas', 'meses', 'anos']);
const issuer = 'tecnologias-api';
const audience = 'tecnologias-web';
const digest = (value) => createHash('sha256').update(value).digest();

function serializar({ _id, nome, base, curvaAprendizado }) {
  return { id: _id.toHexString(), nome, base, curvaAprendizado };
}

function validarTecnologia(req, res, next) {
  const { nome, base, curvaAprendizado } = req.body ?? {};
  const { tempo, unidade } = curvaAprendizado ?? {};

  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 100) {
    return res.status(400).json({ mensagem: 'Informe um nome com até 100 caracteres.' });
  }
  if (typeof base !== 'string' || !base.trim() || base.trim().length > 80) {
    return res.status(400).json({ mensagem: 'Informe uma base com até 80 caracteres.' });
  }
  if (!Number.isInteger(tempo) || tempo < 1 || tempo > 9999 || !unidades.has(unidade)) {
    return res.status(400).json({ mensagem: 'Informe um tempo inteiro de 1 a 9999 e uma unidade válida.' });
  }

  req.tecnologia = { nome: nome.trim(), base: base.trim(), curvaAprendizado: { tempo, unidade } };
  next();
}

export function createApp(config, db) {
  const app = express();
  const usuario = digest(config.adminUser);
  const senha = digest(config.adminPassword);
  const colecao = db.collection('tecnologias');

  app.use(helmet(), cors({ origin: config.origin }), express.json({ limit: '16kb' }));

  app.get('/health', async (_req, res) => {
    try {
      await db.command({ ping: 1 });
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'indisponivel' });
    }
  });

  const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  });

  app.post('/login', limiteLogin, (req, res) => {
    const { usuario: login, senha: password } = req.body ?? {};
    if (typeof login !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ mensagem: 'Informe o usuário e a senha.' });
    }

    const usuarioValido = timingSafeEqual(digest(login.trim()), usuario);
    const senhaValida = timingSafeEqual(digest(password), senha);
    if (!usuarioValido || !senhaValida) {
      return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
    }

    const token = jwt.sign({}, config.jwtSecret, {
      algorithm: 'HS256', expiresIn: '1h', issuer, audience, subject: config.adminUser,
    });
    res.set('Cache-Control', 'no-store').json({ token, tipo: 'Bearer', expiraEm: 3600 });
  });

  function autenticar(req, res, next) {
    const bearer = req.get('Authorization')?.match(/^Bearer ([^\s]+)$/i);
    if (bearer) {
      try {
        const claims = jwt.verify(bearer[1], config.jwtSecret, {
          algorithms: ['HS256'], issuer, audience, subject: config.adminUser,
        });
        if (Number.isInteger(claims.exp)) return next();
      } catch {
        // A mesma resposta vale para tokens inválidos e expirados.
      }
    }
    return res.set('WWW-Authenticate', 'Bearer').status(401).json({ mensagem: 'Token ausente, inválido ou expirado.' });
  }

  const tecnologias = express.Router();
  tecnologias.use(autenticar);
  tecnologias.param('id', (req, res, next, value) => {
    if (!ObjectId.isValid(value)) {
      return res.status(400).json({ mensagem: 'ID inválido.' });
    }
    req.tecnologiaId = new ObjectId(value);
    next();
  });

  const naoEncontrada = (res) => res.status(404).json({ mensagem: 'Tecnologia não encontrada.' });

  tecnologias.get('/', async (_req, res) => {
    const registros = await colecao.find().sort({ _id: -1 }).toArray();
    res.json(registros.map(serializar));
  });
  tecnologias.get('/:id', async (req, res) => {
    const tecnologia = await colecao.findOne({ _id: req.tecnologiaId });
    return tecnologia ? res.json(serializar(tecnologia)) : naoEncontrada(res);
  });
  tecnologias.post('/', validarTecnologia, async (req, res) => {
    const { insertedId } = await colecao.insertOne(req.tecnologia);
    const tecnologia = serializar({ ...req.tecnologia, _id: insertedId });
    res.location(`/tecnologias/${tecnologia.id}`).status(201).json(tecnologia);
  });
  tecnologias.put('/:id', validarTecnologia, async (req, res) => {
    const tecnologia = await colecao.findOneAndUpdate(
      { _id: req.tecnologiaId },
      { $set: req.tecnologia },
      { returnDocument: 'after' },
    );
    return tecnologia ? res.json(serializar(tecnologia)) : naoEncontrada(res);
  });
  tecnologias.delete('/:id', async (req, res) => {
    const { deletedCount } = await colecao.deleteOne({ _id: req.tecnologiaId });
    if (!deletedCount) return naoEncontrada(res);
    res.status(204).end();
  });
  app.use('/tecnologias', tecnologias);

  app.use((_req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ mensagem: 'JSON inválido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ mensagem: 'Corpo da requisição muito grande.' });
    if (error.status === 415) return res.status(415).json({ mensagem: 'Formato ou codificação da requisição não suportados.' });
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro interno da API.' });
  });

  return app;
}
