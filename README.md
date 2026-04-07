# TodoList

Self-hosted Google Tasks clone. Docker + Tailscale for secure access on your network.

## Features

- Multiple task lists with colors
- Tasks with due dates, notes, subtasks
- Recurring tasks (daily, weekly, monthly)
- Drag & drop reordering
- Dark mode UI
- Accessible via Tailscale (HTTPS)

## Quick Start (Docker)

1. Copy `.env.example` to `.env` and set your Tailscale auth key:
   ```bash
   cp .env.example .env
   # Edit .env with your TAILSCALE_AUTHKEY
   ```

2. Run:
   ```bash
   docker compose up -d
   ```

3. Access at `https://todolist.<your-tailnet>.ts.net`

## Get a Tailscale Auth Key

1. Go to [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys)
2. Generate an auth key (reusable recommended)
3. Paste it in `.env`

## Local Development

```bash
# Backend
npm install
npm run dev

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + SQLite
- **Infra**: Docker + Tailscale
