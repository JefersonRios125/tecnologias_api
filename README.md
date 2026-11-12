# Catálogo de tecnologias | API

API REST em Node.js e Express com persistência no MongoDB e autenticação JWT. Cada tecnologia tem nome, linguagem base e tempo médio para atingir proficiência.

## Rodar localmente

Requisitos: Node.js 24 ou superior e uma instância do MongoDB local ou no Atlas.

No PowerShell, dentro da pasta do projeto:

```powershell
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

No Bash, use `cp .env.example .env` para copiar o arquivo.

Edite o `.env`. Cole o segredo gerado em `JWT_SECRET` e defina uma senha de pelo menos 12 caracteres em `ADMIN_PASSWORD`. Use `ADMIN_USER` e `ADMIN_PASSWORD` para entrar pelo front-end.

- **MongoDB local** · mantenha `MONGODB_URI=mongodb://127.0.0.1:27017` com o serviço em execução.
- **MongoDB Atlas** · use a string de conexão do seu cluster em `MONGODB_URI`. O usuário do banco precisa ter acesso de leitura e escrita ao banco e seu IP precisa estar autorizado no Atlas.
- O banco padrão é `catalogo_tecnologias`. A coleção `tecnologias` é criada no primeiro cadastro.
- Se mudar o endereço do front-end, atualize `FRONTEND_ORIGIN` com a origem correspondente, sem barra no final.

```powershell
npm start
```

A API roda em `http://127.0.0.1:3001`. A rota `GET /health` responde com `200` quando a API consegue consultar o MongoDB.

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

O front-end fica no projeto separado `tecnologias-web`. Mantenha as credenciais e o segredo JWT no `.env` da API.
