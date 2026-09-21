# Migration Notes: Updating TomDoesTech's REST API Tutorial for 2026

This tutorial (`REST-API-Tutorial-Updated`) was built against older versions of Zod, Mongoose, and Lodash. Since then, all three shipped breaking changes. Below is what changed and how I adapted the code, working through each error as it came up rather than pinning to older package versions.

## Mongoose 9

### `FilterQuery` → `QueryFilter`
Mongoose 9 renamed the type used for query filters.

```typescript
// Before (Mongoose 8 and earlier)
import type { FilterQuery } from "mongoose";
export async function findSessions(query: FilterQuery<SessionDocument>) { ... }

// After (Mongoose 9)
import type { QueryFilter } from "mongoose";
export async function findSessions(query: QueryFilter<SessionDocument>) { ... }
```

`QueryFilter` also enforces stricter typing on top-level keys than the old `FilterQuery` did — queries with mismatched value types now fail at compile time instead of silently passing.

### `DocumentDefinition<T>` removed
This helper type was dropped entirely. It used to be the go-to way to type "the plain-object shape of a document, without the Mongoose Document methods" — used for service function inputs like `createUser(input: DocumentDefinition<UserDocument>)`.

Two problems with trying to patch this using `Omit`:
- `Omit<UserDocument, keyof mongoose.Document>` still leaks custom fields (`comparePassword`, timestamps, etc.) that aren't inherited from `Document`.
- Typing service inputs directly off the Mongoose document type at all is the wrong move — a document type carries every `Document` method (`_id`, `save`, `$assertPopulated`, ...), so `Omit`-ing just a couple of fields still leaves dozens of required properties you never meant to pass in.

**Fix:** stop deriving "plain input" types from the Mongoose document. Derive them from the Zod schema instead, since that's what actually describes validated input:

```typescript
export type CreateUserInput = Omit<
  z.infer<typeof createUserSchema>["body"],
  "passwordConfirmation"
>;

export async function createUser(input: CreateUserInput) {
  return User.create(input);
}
```

For fields that exist on the document but aren't part of the validated body (e.g. `user` on a Product, set from the session rather than the request), intersect it in manually:

```typescript
export async function createProduct(input: CreateProductInput["body"] & { user: string }) {
  return Product.create(input);
}
```

## Zod v4

### Import style
```typescript
// Before
import * as z from "zod";

// After
import { z } from "zod";
```

### `required_error` / `invalid_type_error` dropped
Replaced entirely by a unified `error` param (string or a function receiving the issue):

```typescript
// Before
z.string({ required_error: "Title is required" })

// After
z.string({ error: "Title is required" })
```

### Top-level string formats
`.email()`, `.uuid()`, `.url()` etc. as chained methods on `z.string()` are deprecated (still work, but flagged). Zod 4's preferred form moves them to top-level functions:

```typescript
// Deprecated but functional
z.string().email()

// Current
z.email()
```

### `TypeOf` from `"zod/v3"`
Mixing `TypeOf` imported from `"zod/v3"` with a schema built using `z` from `"zod"` (v4) causes a dual-type-resolution error. Use `z.infer<typeof schema>` instead — it's the same concept, correctly resolved against v4's types.

## Lodash / ESM

`lodash` is CommonJS. Both of these fail against Node's real ESM loader, even though TypeScript's `esModuleInterop` lets them type-check fine:

```typescript
import omit from "lodash";              // wrong — imports the whole library as one object
import { omit } from "lodash";          // type-checks, but fails at RUNTIME with a SyntaxError
```

**Fix used:** switched to `lodash-es`, which has real ESM named exports:
```bash
npm install lodash-es
npm install --save-dev @types/lodash-es
```
```typescript
import { omit, get } from "lodash-es";
```

(Alternative fixes that also work: `import omit from "lodash/omit.js"` per-function path import, or a default import `_` used as `_.omit(...)`.)

## JWT payload gotcha (not a version change, but worth noting)

`jsonwebtoken`'s `sign()` throws `TypeError: validator.isValid is not a function` when the payload is a raw Mongoose document rather than a plain object — Mongoose documents carry internal prototype properties that trip up the library's internal validation.

**Fix:** always call `.toJSON()` on a Mongoose document before signing it into a token:
```typescript
signJwt({ ...omit(user.toJSON(), ["password"]), session: session._id }, { ... });
```

## Takeaway

None of this was a rewrite — the tutorial's architecture (routes → controllers → services → models, Zod validation, JWT + refresh token sessions) is unaffected. Everything above is API surface that moved underneath it. Worth re-checking against the official changelogs before starting a similar project from an older tutorial:
- https://zod.dev/v4/changelog
- https://mongoosejs.com/docs/migrating_to_9.html
