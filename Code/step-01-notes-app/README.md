# Notes API

A REST API for managing notes, built with Node.js' built-in `http` module and the built-in `node:sqlite` database — no external runtime dependencies. The same server also serves a small WebUI for adding and browsing notes.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The server listens on [http://localhost:3001](http://localhost:3001) — open it in a
browser for the WebUI, or hit the REST endpoints under `/notes` directly.

## Production

```bash
npm run build
npm start
```

## Troubleshooting

### `ERR_UNKNOWN_FILE_EXTENSION` for `.ts` files

If you see this error when running `npm run dev`:

```
TypeError: Unknown file extension ".ts"
```

This happens with older TypeScript runners on newer Node.js versions. The project uses `tsx` which handles ESM TypeScript properly.

### `Cannot find module 'node:sqlite'`

The app uses the built-in `node:sqlite` module, which is only available in Node.js 22+. Check your version:

```bash
node --version  # must be v22.x.x or higher
```

If it is older, upgrade Node.js (e.g. `nvm install 22 && nvm use 22`).

> Note: `node:sqlite` is still marked experimental, so starting the server prints
> `ExperimentalWarning: SQLite is an experimental feature` — this is harmless.
