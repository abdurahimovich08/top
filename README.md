# Top Services Marketplace Backend

This repository hosts the NestJS backend for the Top services marketplace. It exposes REST APIs for authentication, provider onboarding, service discovery, bookings, payments, reviews, chat, and administrative tooling.

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Docker (for Postgres + API stack)

### Environment

Copy `.env.example` to `.env` inside the `backend` directory and adjust the variables as needed.

```bash
cp backend/.env.example backend/.env
```

### Install & Run (local)

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

### Docker Compose

Run the API and Postgres with Docker:

```bash
docker-compose up --build
```

The API will be available at `http://localhost:3000/api` and Swagger docs at `http://localhost:3000/docs`.

## Prisma

- Schema: `backend/prisma/schema.prisma`
- Seed: `npm run prisma:seed`
- Example migration is located under `backend/prisma/migrations/0001_init`.

## Key Endpoints

- `/auth/request-otp`, `/auth/verify-otp`
- `/users/me`, `/users/me/addresses`
- `/services`, `/services/:id`, `/services/:id/publish`
- `/bookings`, `/bookings/me`, `/bookings/:id/status`
- `/payments/:bookingId/intent`, `/payments/:bookingId/confirm`
- `/reviews`, `/reviews/service/:serviceId`
- `/chat` (REST) & `/chat` WebSocket namespace
- `/admin/providers`, `/admin/disputes`

Refer to Swagger documentation for full API descriptions.

## Testing

Run Prisma checks:

```bash
cd backend
npm run lint
npm test
```

## Seeding

Sample categories and providers are created via `npm run prisma:seed` to accelerate development.

