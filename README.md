# Catálogo de tecnologias | API

API REST em Node.js e Express com persistência no MongoDB e autenticação JWT. Cada tecnologia tem nome, linguagem base e tempo médio para atingir proficiência.

Interface do catálogo no [repositório do front-end](https://github.com/JefersonRios125/tecnologias_web).

## Rodar os dois projetos juntos

Você precisa do Git, do Node.js 24 ou superior e de um MongoDB local ou no Atlas. Clone os dois repositórios na mesma pasta.

```powershell
git clone https://github.com/JefersonRios125/tecnologias_api.git
git clone https://github.com/JefersonRios125/tecnologias_web.git
```

### Terminal 1 · API

Na pasta que contém os dois projetos, execute:

```powershell
cd tecnologias_api
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Abra `tecnologias_api/.env` e configure:

| Variável | Valor ou configuração |
| --- | --- |
| `MONGODB_URI` | Para MongoDB local, use `mongodb://127.0.0.1:27017` e deixe o serviço rodando. Para Atlas, use a string de conexão do seu cluster. O usuário do banco precisa ter acesso de leitura e escrita e o seu IP precisa estar autorizado. |
| `MONGODB_DATABASE` | `catalogo_tecnologias`. O primeiro cadastro cria a coleção `tecnologias` se ela ainda não existir. |
| `ADMIN_USER` | Usuário do catálogo. O exemplo usa `admin`. |
| `ADMIN_PASSWORD` | Senha do catálogo, com pelo menos 12 caracteres. |
| `JWT_SECRET` | Valor gerado pelo comando acima. |
| `FRONTEND_ORIGIN` | `http://localhost:5173`. Use o endereço exato do front-end, sem barra no final. |

Mantenha as credenciais no `.env` local. Inicie a API com `npm start` e mantenha o terminal aberto. Acesse [a rota de teste da API](http://127.0.0.1:3001/health). O retorno `{"status":"ok"}` confirma que ela consegue acessar o MongoDB.

### Terminal 2 · Front-end

Abra outro terminal na pasta que contém os dois projetos e execute:

```powershell
cd tecnologias_web
npm ci
Copy-Item .env.example .env
npm run dev
```

No `tecnologias_web/.env`, o exemplo já define `VITE_API_URL=http://127.0.0.1:3001`. Se a API estiver em outro endereço, ajuste essa variável e reinicie o Vite. Se alterar a origem do front-end, ajuste `FRONTEND_ORIGIN` no `.env` da API e reinicie a API. No Bash, use `cp .env.example .env` no lugar de `Copy-Item .env.example .env`.

### Testar a integração

1. Abra [o catálogo](http://localhost:5173/) e entre com `ADMIN_USER` e `ADMIN_PASSWORD` definidos na API.
2. Cadastre **Laravel**, base **PHP**, com tempo de **3 meses**. Recarregue a página e confira se o registro continua na tabela. Use **Editar** e **Excluir** para testar o restante do CRUD.
3. Abra [a rota de tecnologias diretamente](http://127.0.0.1:3001/tecnologias). O retorno `401` é esperado sem o JWT. Após o login, o front-end envia o token automaticamente no cabeçalho `Authorization: Bearer ...`.

## Rotas

| Método | Rota | Resultado |
| --- | --- | --- |
| POST | `/login` | Recebe `usuario` e `senha` no JSON e emite o JWT |
| GET | `/tecnologias` | Lista os registros |
| GET | `/tecnologias/:id` | Consulta uma tecnologia |
| POST | `/tecnologias` | Cadastra uma tecnologia e retorna `201` |
| PUT | `/tecnologias/:id` | Atualiza os campos da tecnologia |
| DELETE | `/tecnologias/:id` | Exclui o registro e retorna `204` |

O JWT vence em uma hora. Envie `Authorization: Bearer SEU_TOKEN` em todas as rotas de tecnologias. Token ausente, inválido ou expirado retorna `401`.

Exemplo de corpo JSON para POST ou PUT:

```json
{
  "nome": "Laravel",
  "base": "PHP",
  "curvaAprendizado": {
    "tempo": 3,
    "unidade": "meses"
  }
}
```

O tempo é uma estimativa informada no cadastro. Use um inteiro de 1 a 9999 e uma das unidades `dias`, `semanas`, `meses` ou `anos`. O campo `base` aceita texto como PHP, C#, JavaScript ou TypeScript. Cada registro recebe um ID gerado pelo MongoDB.
