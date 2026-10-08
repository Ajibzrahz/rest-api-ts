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

### MongoDB driver 7.6.0 breaks `mongodb-memory-server` under Jest

Mongoose 9.10.x pulls in `mongodb@~7.6`. Version 7.6.0 of the driver changed how it loads Node's `os` module internally — it switched to a dynamic `import('os')` call. Under Jest's CommonJS execution environment, that dynamic import fails silently (no thrown error, it just never resolves in time), leaving the client handshake metadata incomplete. The result, only when running tests through Jest — the real dev server connects fine:

```
MongooseServerSelectionError: Missing required sub-document 'driver' in the client metadata document
```

This is a confirmed upstream regression (tracked as NODE-7832), not a project misconfiguration. Pinning the actual `mongodb` driver version back to the last known-good release via npm `overrides` fixes it, independent of whatever Mongoose version is installed:

```json
// package.json
"overrides": {
  "mongodb": "7.5.0"
}
```

After adding the override, a clean reinstall is required — `npm install` alone on top of an existing lockfile won't fully apply it:

```bash
rm -rf node_modules package-lock.json
npm install
npm ls mongodb   # confirm both mongoose and mongodb-memory-server resolve to 7.5.0
```

Remove this override once NODE-7832 ships a fix and `mongodb-memory-server`/Jest compatibility catches up.

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

## Module system: reverted from native ESM to CommonJS

The project originally used `"type": "module"` with native `import`/`export` and `.js`-suffixed relative imports. This was reverted to CommonJS after the ESM toolchain caused repeated, compounding friction — Jest's ESM support is still experimental, and several commonly-used packages don't yet ship a usable ESM-mode testing story. None of this was a problem with the app itself; it only surfaced once Jest entered the picture.

**What ESM caused, concretely:**
- `jest.spyOn()` cannot reassign a method on a namespace import (`import * as UserService from "..."`) — ES module exports are read-only bindings by spec, not by Jest's choice. Working around it required `jest.unstable_mockModule()` plus dynamic `import()`, considerably more ceremony than the equivalent CommonJS mock.
- Jest needed `--experimental-vm-modules`, `ts-jest`'s `createDefaultEsmPreset`, `extensionsToTreatAsEsm`, and a `moduleNameMapper` to strip `.js` extensions from relative imports before it could even resolve test files.
- `dotenv.config()` had to run before any other import — but ESM resolves and executes *all* imports in a file before any other code in that file runs, so placing `dotenv.config()` "early" in the file wasn't actually early enough. Fixed at the time via `--import dotenv/config` as a Node CLI flag, bypassing the file's own import order entirely.
- The `config` npm package (v5) ships an internal `.mjs` file that it `require()`s conditionally, relying on a Node 22.12+ feature (native `require()` of ESM) that Jest's module loader doesn't support — threw `Must use import to load ES Module` specifically under Jest, even though the real dev server ran fine.

**What changed to revert:**
- `package.json`: removed `"type": "module"`.
- `tsconfig.json`: `"module"` set to `"commonjs"`; `"verbatimModuleSyntax"` removed (it requires `package.json`'s `type` and `tsconfig`'s `module` to agree on ESM, which no longer applies).
- All relative imports: dropped the `.js` extension (`"../models/session-model.js"` → `"../models/session-model"`). Not required under CommonJS resolution, but kept consistent.
- `jest.config.js`: reverted to `createDefaultPreset` (not `createDefaultEsmPreset`); dropped `extensionsToTreatAsEsm` and the `.js`-stripping `moduleNameMapper`; test scripts dropped `--experimental-vm-modules` entirely.
- `config/default.ts` → `config/default.cjs`, with `export default {...}` changed to `module.exports = {...}`. This also removed the need for `ts-node` as a dependency (the `config` package's `.ts`-file loader requires it; `.cjs`/`.js` files load without it).

### Lodash / ESM

With the project back on CommonJS, plain `lodash` works directly — no ESM-specific package needed:

```typescript
import { omit } from "lodash";
```

(`lodash-es` — the ESM-only build used during the ESM phase of this project — was removed. If working in a genuine ESM project, `lodash-es` is still the correct choice, since plain `lodash`'s CommonJS exports don't resolve cleanly under Node's real ESM loader.)

### nanoid is ESM-only as of v4

Current `nanoid` (v4+) dropped CommonJS support entirely — no CJS build is published at all, so `require("nanoid")` fails outright in a CommonJS project, not just under Jest. Pinned to the last CommonJS-compatible major version instead:

```bash
npm install nanoid@^3.3.7
```

`customAlphabet` and the rest of the API used in this project are unchanged between v3 and v4 — only the module format differs.

## JWT payload gotcha (not a version change, but worth noting)

`jsonwebtoken`'s `sign()` throws `TypeError: validator.isValid is not a function` when the payload is a raw Mongoose document rather than a plain object — Mongoose documents carry internal prototype properties that trip up the library's internal validation.

**Fix:** always call `.toJSON()` on a Mongoose document before signing it into a token:
```typescript
signJwt({ ...omit(user.toJSON(), ["password"]), session: session._id }, { ... });
```

## Takeaway

None of this was a rewrite — the tutorial's architecture (routes → controllers → services → models, Zod validation, JWT + refresh token sessions) is unaffected. Everything above is API surface that moved underneath it, plus one significant tooling decision (ESM vs. CommonJS) reversed once its cost became clear in practice. Worth re-checking against the official changelogs before starting a similar project from an older tutorial:
- https://zod.dev/v4/changelog
- https://mongoosejs.com/docs/migrating_to_9.html
- https://jestjs.io/docs/ecmascript-modules (Jest's ESM support — read this before choosing `"type": "module"` for a project that will be tested with Jest)