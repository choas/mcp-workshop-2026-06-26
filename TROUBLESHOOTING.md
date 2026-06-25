# Troubleshooting Guide

Common issues and solutions for the MCP Workshop.

---

## Verify Your Setup

Want to confirm everything works before (or during) the workshop? There's an
optional smoke test that starts every MCP server and checks its behavior.

```bash
# 1. Build every phase/server first (run in each folder):
#    npm install && npm run build
# 2. Run the smoke test from the complete/ folder:
cd Code/step-02-notes-mcp/complete
node workshop-smoke.mjs
```

It checks Notes MCP phases 1-4, the complete server, and the weather +
geocoding servers, printing `PASS`/`FAIL` per check and exiting non-zero if
anything is broken. A green run means your environment is ready.

---

## Node.js Issues

### Wrong Node Version

**Symptom:** Errors about unsupported syntax, missing features, or `engine` requirements.

**Solution:**
```bash
# Check your version
node --version

# Need Node 22+ (required for built-in node:sqlite), use nvm to switch
nvm install 22
nvm use 22
```

### npm Cache Problems

**Symptom:** Packages fail to install, corrupted downloads, or checksum errors.

**Solution:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "allow-scripts" Warning During Install

**Symptom:** `npm install` prints something like:
```text
npm warn allow-scripts 2 packages have install scripts not yet covered by allowScripts
```

**Solution:** This is expected and harmless. It refers to native build steps for
`esbuild` and `fsevents` (a transitive dependency of `tsx`). Installs still
complete successfully and the workshop works — you can ignore the warning.

### Permission Errors (Linux/Mac)

**Symptom:** `EACCES` errors when installing global packages.

**Solution:**
```bash
# Use nvm (recommended) or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

## Database Issues

### SQLite Database Locked

**Symptom:** `SQLITE_BUSY: database is locked`

**Solution:**
```bash
# Kill any running server processes
pkill -f "tsx"
pkill -f "node.*index"

# Or simply delete and recreate
rm data/notes.db
npm run dev
```

### Permission Errors on Data Folder

**Symptom:** Cannot create or write to `data/notes.db`

**Solution:**
```bash
# Create data folder with proper permissions
mkdir -p data
chmod 755 data
```

### Database Schema Mismatch

**Symptom:** Missing columns or table errors after code changes.

**Solution:**
```bash
# Reset the database
rm data/notes.db
npm run dev  # Recreates with correct schema
```

---

## MCP Inspector Issues

### Port Already in Use

**Symptom:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find what's using the port
lsof -i :3001  # or whatever port

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3003 npm run dev
```

### Transport Connection Failed

**Symptom:** MCP Inspector can't connect to server.

**Checklist:**
1. Is the MCP server running? Check terminal output.
2. Are you using the correct transport? (stdio vs SSE)
3. Try restarting both server and inspector.

**For stdio transport:**
```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

### Inspector Shows No Tools/Resources

**Symptom:** Connected but tools/resources list is empty.

**Solution:**
- Check server code registers tools before `server.connect()`
- Look for errors in server startup logs
- Verify handler functions are properly exported

---

## TypeScript Issues

### tsx Not Found

**Symptom:** `command not found: tsx`

**Solution:**
```bash
# Install as dev dependency
npm install --save-dev tsx typescript

# Or run via npx
npx tsx src/index.ts
```

### Type Errors on Build

**Symptom:** TypeScript compilation errors.

**Quick fixes:**
```bash
# Check for missing types
npm install --save-dev @types/node

# If stuck, use ts-ignore (last resort!)
// @ts-ignore
```

### Module Resolution Errors

**Symptom:** `Cannot find module` errors.

**Solution:**
```bash
# Check tsconfig.json has correct settings
{
  "compilerOptions": {
    "esModuleInterop": true,
    "moduleResolution": "node"
  }
}
```

---

## Network Issues

### External APIs Not Responding

**Symptom:** Weather or quotes API calls timeout or fail.

**Solutions:**
1. Check internet connection
2. Try the API in browser: https://wttr.in/Munich?format=j1
3. Check if corporate firewall is blocking
4. Use fallback mock data if the API is unreachable

### CORS Errors

**Symptom:** Browser console shows CORS policy errors.

**Solution:** Set CORS headers on the Node.js HTTP responses:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### Firewall Blocking Ports

**Symptom:** Can access localhost but not from other devices.

**Solution:**
- Workshop uses only localhost, this shouldn't matter
- If needed, check firewall settings for ports 3001, 3002

---

## Cross-Platform Issues

### Windows Path Problems

**Symptom:** Paths with backslashes fail, or `ENOENT` errors.

**Solution:** Use `path.join()` instead of string concatenation:
```typescript
import path from 'path';
const dbPath = path.join(__dirname, '..', 'data', 'notes.db');
```

### Line Ending Issues

**Symptom:** Scripts fail with `\r` errors or "bad interpreter".

**Solution:**
```bash
# Convert to Unix line endings
sed -i 's/\r$//' script.sh

# Or configure git
git config core.autocrlf input
```

### Different Shell Behaviors

**Symptom:** Commands work on Mac/Linux but not Windows.

**Solution:** Use npm scripts instead of shell commands:
```json
{
  "scripts": {
    "reset-db": "node scripts/reset-db.js"
  }
}
```

---

## MCP-Specific Issues

### Tool Not Being Called

**Symptom:** LLM doesn't use your tool even when relevant.

**Checklist:**
- Tool name is clear and descriptive?
- Tool description explains when to use it?
- Input schema is correct?
- Try explicit prompt: "Use the add_note tool to..."

### Resource URI Not Matching

**Symptom:** `Resource not found` errors.

**Check:**
```typescript
// Template must match exactly
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  // notes://recent vs notes://recent/ (trailing slash!)
});
```

### Prompt Arguments Not Passed

**Symptom:** Prompt template receives undefined arguments.

**Solution:** Check argument names match exactly:
```typescript
// In prompt definition
arguments: [{ name: "topic", required: true }]

// In handler
const topic = request.params.arguments?.topic;
```

---

## Quick Reset Procedure

If everything is broken, start fresh:

```bash
# 1. Kill all node processes
pkill -f node

# 2. Remove generated files
rm -rf node_modules
rm -rf data/*.db
rm package-lock.json

# 3. Reinstall
npm install

# 4. Start fresh
npm run dev
```

---

## Getting Help

1. **Check the completed reference code** - Each step has a `complete/` or final-phase folder with working code (e.g. `Code/step-02-notes-mcp/complete`)
2. **Ask your neighbor** - They might have solved it
3. **Raise your hand** - Workshop facilitators can help
4. **Check MCP docs** - https://modelcontextprotocol.io

---

## Common Error Messages Quick Reference

| Error | Likely Cause | Quick Fix |
|-------|--------------|-----------|
| `EADDRINUSE` | Port in use | Kill process or change port |
| `SQLITE_BUSY` | DB locked | Kill node processes |
| `ENOENT` | File not found | Check paths, create folders |
| `EACCES` | Permission denied | Check file permissions |
| `MODULE_NOT_FOUND` | Missing package | Run `npm install` |
| `SyntaxError: Unexpected token` | Wrong Node version | Use Node 22+ |
| `Cannot find module 'node:sqlite'` | Node older than 22 | Upgrade to Node 22+ |
| `TypeError: X is not a function` | Import error | Check import statement |
