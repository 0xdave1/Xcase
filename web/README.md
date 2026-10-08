# Xcase Borderless Exchange MVP

This is a runnable MVP implementation for the Xcase XOF ⇄ NGN exchange platform.

## Features implemented

- Customer onboarding (name, phone, country, EN/FR language)
- Session-based authentication for customer and admin flows
- Live rate retrieval (XOF→NGN and NGN→XOF)
- Quote generation with fee and expiry
- Transaction creation with proof note capture
- Transaction history for customers
- Admin dashboard with metrics and status updates (Processing/Completed/Rejected)
- Input validation and structured API errors
- Responsive UI for customer and admin pages

## Environment variables

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `XCASE_SESSION_SECRET` | Secret used to sign HTTP-only session cookies |
| `XCASE_ADMIN_EMAIL` | Admin login email |
| `XCASE_ADMIN_PASSWORD` | Admin login password |

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the customer flow and `http://localhost:3000/admin` for admin operations.

## Quality checks

```bash
npm run lint
npm run build
```
