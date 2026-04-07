/**
 * @module routes
 * Barrel export for all API route handlers.
 * Each router is a standalone Express Router handling one resource.
 */
export { default as listRoutes } from './lists.js';
export { default as taskRoutes } from './tasks.js';
export { default as subtaskRoutes } from './subtasks.js';
export { default as batchRoutes } from './batch.js';
export { default as webhookRoutes } from './webhooks.js';
export { default as healthRoutes } from './health.js';
export { default as exportRoutes } from './export.js';
