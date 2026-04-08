/**
 * @module tests/integration/api
 * Integration tests for the TodoList API.
 * Uses Node.js built-in test runner (node --test) + assert. Zero dependencies.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000/api';
let createdTaskId: number;
let createdListId: number;

async function api<T>(path: string, opts?: RequestInit): Promise<{ status: number; body: T }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const body = res.status === 204 ? (null as T) : await res.json() as T;
  return { status: res.status, body };
}

describe('API Integration Tests', () => {
  it('GET /health returns 200 with status ok', async () => {
    const { status, body } = await api<any>('/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(typeof body.uptime === 'number');
  });

  it('GET /lists returns array with default list', async () => {
    const { status, body } = await api<any[]>('/lists');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    assert.ok(body.length >= 1);
    assert.equal(body[0].name, 'My Tasks');
  });

  it('POST /lists validates input', async () => {
    const { status } = await api('/lists', { method: 'POST', body: JSON.stringify({}) });
    assert.equal(status, 400);
  });

  it('POST /lists creates a list', async () => {
    const { status, body } = await api<any>('/lists', {
      method: 'POST', body: JSON.stringify({ name: 'Test List' }),
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'Test List');
    createdListId = body.id;
  });

  it('POST /tasks validates input', async () => {
    const { status } = await api('/tasks', { method: 'POST', body: JSON.stringify({}) });
    assert.equal(status, 400);
  });

  it('POST /tasks creates a task', async () => {
    const { status, body } = await api<any>('/tasks', {
      method: 'POST', body: JSON.stringify({ list_id: 1, title: 'Integration test task' }),
    });
    assert.equal(status, 201);
    assert.equal(body.title, 'Integration test task');
    assert.equal(body.completed, 0);
    createdTaskId = body.id;
  });

  it('GET /tasks returns tasks with subtasks', async () => {
    const { status, body } = await api<any[]>('/tasks?list_id=1');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    const task = body.find((t: any) => t.id === createdTaskId);
    assert.ok(task, 'Created task should be in list');
    assert.ok(Array.isArray(task.subtasks));
  });

  it('PUT /tasks/:id updates a task', async () => {
    const { status, body } = await api<any>(`/tasks/${createdTaskId}`, {
      method: 'PUT', body: JSON.stringify({ title: 'Updated title' }),
    });
    assert.equal(status, 200);
    assert.equal(body.title, 'Updated title');
  });

  it('PUT /tasks/:id/complete toggles completion', async () => {
    const { status, body } = await api<any>(`/tasks/${createdTaskId}/complete`, { method: 'PUT' });
    assert.equal(status, 200);
    assert.equal(body.completed, 1);
  });

  it('DELETE /tasks/:id deletes a task', async () => {
    const { status } = await api(`/tasks/${createdTaskId}`, { method: 'DELETE' });
    assert.equal(status, 200);
  });

  it('DELETE /lists/:id deletes a list', async () => {
    const { status } = await api(`/lists/${createdListId}`, { method: 'DELETE' });
    assert.equal(status, 200);
  });

  it('GET /export returns backup data', async () => {
    const { status, body } = await api<any>('/export');
    assert.equal(status, 200);
    assert.ok(body.version);
    assert.ok(Array.isArray(body.lists));
    assert.ok(Array.isArray(body.tasks));
  });
});
