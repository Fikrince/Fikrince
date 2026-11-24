import 'dotenv/config';
import express from 'express';
import { createApiRouter } from './src/server/api-router.ts';
import { JsonFileRepository } from './src/server/repository.ts';

const PORT = Number(process.env.PORT || 3001);

const app = express();
const repo = new JsonFileRepository();

app.use(express.json({ limit: '1mb' }));
app.use('/api', createApiRouter(repo));

app.get('/', (_req, res) => {
  res.json({
    service: 'FİKRİNCE Backend API',
    health: '/api/health',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FİKRİNCE standalone backend API listening on http://localhost:${PORT}`);
});
