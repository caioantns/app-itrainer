# iTrainer
1. Suba esta pasta para um repositório no GitHub.
2. No Render: New > Blueprint > escolha o repositório (usa o render.yaml: web service + PostgreSQL).
3. Aguarde o deploy. Abra a URL pública: ela é o cadastro (RF01).
4. Abra `URL/qr` para projetar ou imprimir o QR code.
5. Métricas: `URL/api/metricas?chave=SEU_ADMIN_KEY` (a chave está em Environment no Render).
6. Local: copie `.env.example` para `server/.env`, rode `npm run build && npm start`. Dev do front: `npm --prefix client run dev`.
7. Testes: `DATABASE_URL=... npm test` (sem DATABASE_URL só roda o gerador de plano).
Tabelas são criadas sozinhas no start (`server/schema.sql`). Modelos de treino: `server/plano.js`.
