/**
 * @module server
 * Express application entry point.
 * Mounts all API routes, serves static frontend, loads plugins.
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  listRoutes, taskRoutes, subtaskRoutes,
  batchRoutes, webhookRoutes, healthRoutes, exportRoutes,
} from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// API routes (one per resource)
app.use('/api', healthRoutes);
app.use('/api', listRoutes);
app.use('/api', taskRoutes);
app.use('/api', batchRoutes);
app.use('/api', subtaskRoutes);
app.use('/api', webhookRoutes);
app.use('/api', exportRoutes);

// OpenAPI spec
const specPath = path.join(__dirname, '..', 'openapi.yaml');
app.get('/api/openapi.yaml', (_req, res) => {
  res.type('text/yaml').send(fs.readFileSync(specPath, 'utf-8'));
});

// Plugin auto-loader
const pluginDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginDir)) {
  for (const file of fs.readdirSync(pluginDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'))) {
    import(path.join(pluginDir, file)).then((mod) => {
      if (mod.default?.router) app.use('/api', mod.default.router);
      console.log(`Plugin loaded: ${file}`);
    }).catch((e) => console.error(`Plugin ${file} failed:`, e.message));
  }
}

// Static frontend
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist, { maxAge: '1d', etag: true }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api/openapi.yaml`);
});
