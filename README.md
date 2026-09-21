# rest-api-ts

A TypeScript REST API built with Express, MongoDB (Mongoose), and Zod — JWT-based authentication with access + refresh token sessions, and a products resource with full CRUD.

Originally based on TomDoesTech's REST API tutorial series, updated to work against current major versions of Zod (v4), Mongoose (v9), and Lodash (ESM via `lodash-es`). See [`MIGRATION_NOTES.md`](./MIGRATION_NOTES.md) for a full breakdown of what changed and how it was adapted.

## Tech stack

- **Runtime:** Node.js, TypeScript
- **Framework:** Express.js
- **Database:** MongoDB, Mongoose 9
- **Validation:** Zod 4
- **Auth:** JWT (RS256), access + refresh token pattern, session tracking in MongoDB
- **Other:** bcrypt (password hashing), pino (logging), dayjs, lodash-es, nanoid, config, cors

## Features

- User registration with hashed passwords (bcrypt)
- Login via JWT access + refresh tokens, with per-login session records in MongoDB
- Token refresh flow (expired access token + valid refresh token → new access token)
- Session invalidation ("logout") via soft-delete on the session record
- Auth middleware that attaches the decoded user to `res.locals.user` on every request
- Route-level guard (`requireUser`) for protected endpoints
- Product resource: create, read, update, delete — scoped to the authenticated user
- Request validation on all mutating routes via Zod schemas (body + params)
- Service-layer architecture: routes → controllers → services → models, keeping DB queries out of controllers

## Project structure

```
src/
  controllers/    # Express request handlers — parse req, call services, shape res
  service/        # DB queries and business logic — no req/res, no HTTP concerns
  models/         # Mongoose schemas and document types
  schema/         # Zod validation schemas (+ inferred TS types)
  middleware/     # validate-resource, authorization (deserializeUser), requireUser
  utils/          # JWT signing/verification helpers
  routes.ts       # Route → middleware → controller wiring
```

## Getting started

```bash
git clone <this-repo-url>
cd rest-api-ts
npm install
```

You'll need:
- A running MongoDB instance
- RSA key pair for JWT signing (RS256) — generate your own via [travistidwell.com/jsencrypt/demo](https://travistidwell.com/jsencrypt/demo) or Node's `crypto.generateKeyPairSync`, and set them as environment variables (do **not** commit real keys to a config file)

```bash
npm run dev
```

## API overview

| Method | Endpoint          | Auth required | Description                          |
|--------|-------------------|----------------|--------------------------------------|
| GET    | `/healthCheck`    | No             | Health check                         |
| POST   | `/api/users`      | No             | Register a new user                  |
| POST   | `/api/sessions`   | No             | Log in (create a session)            |
| GET    | `/api/sessions`   | Yes            | Get current session                  |
| DELETE | `/api/sessions`   | Yes            | Log out (invalidate current session) |
| POST   | `/api/products`   | Yes            | Create a product                     |
| GET    | `/api/products/:productId`   | No  | Get a product                        |
| PUT    | `/api/products/:productId`   | Yes | Update a product                     |
| DELETE | `/api/products/:productId`   | Yes | Delete a product                     |

> Note: double-check the exact product routes/methods against `routes.ts` before publishing — filled in here based on the schemas built so far.

## What's next

- Finish out remaining product CRUD edge cases (pagination/filtering)
- Jest test coverage (unit tests for services, integration tests for routes)
- Move hardcoded config values to `.env`
