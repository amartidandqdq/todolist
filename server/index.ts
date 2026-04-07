import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import listRoutes from './routes/lists.js';
import taskRoutes from './routes/tasks.js';
import subtaskRoutes from './routes/subtasks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.use('/api', listRoutes);
app.use('/api', taskRoutes);
app.use('/api', subtaskRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist, { maxAge: '1d', etag: true }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
