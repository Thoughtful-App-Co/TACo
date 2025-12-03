# 🚀 Starting Local Development

## Quick Start

### Step 1: Stop Any Running Servers

If you have any terminals running dev servers, stop them with `Ctrl+C`.

### Step 2: Build the Project

```bash
npm run build
```

This creates `dist/` with your functions.

### Step 3: Start Both Dev Servers

```bash
npm run dev
```

You should see output from **both** servers:

```
[vite] VITE v5.4.21  ready in XXX ms
[vite] ➜  Local:   http://localhost:3000/

[wrangler] ⎔ Starting local server...
[wrangler] Ready on http://localhost:8787
```

### Step 4: Open Browser

Navigate to: **http://localhost:3000**

### Step 5: Configure API Key

1. Click the **Settings** icon (gear) in the header
2. Select **"Bring Your Own Key"**
3. Enter your Claude API key from https://console.anthropic.com/
4. Click **Save**

### Step 6: Test the App

1. Go to **Brain Dump**
2. Add some tasks (one per line):
   ```
   Write documentation for the API
   Review pull requests
   Update test suite
   ```
3. Click **"Process Tasks"**
4. You should see the tasks get processed and organized into stories!

## Troubleshooting

### "Failed to process tasks" Error

**Symptoms:** 404 or 500 errors when processing tasks

**Solutions:**

1. **Make sure both servers are running:**

   ```bash
   # You should see BOTH in your terminal:
   # [vite] ... http://localhost:3000
   # [wrangler] ... http://localhost:8787
   ```

2. **Rebuild if needed:**

   ```bash
   npm run build
   ```

3. **Restart dev servers:**
   - Press `Ctrl+C` to stop
   - Run `npm run dev` again

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8787
lsof -ti:8787 | xargs kill -9

# Then start again
npm run dev
```

### API Key Not Working

1. Check browser DevTools → Application → Local Storage
2. Look for `tempo-api-config` key
3. Verify it contains your API key
4. Re-enter API key in Settings if needed

### Wrangler Not Starting

```bash
# Clear Wrangler cache
rm -rf .wrangler/

# Reinstall
npm install

# Try again
npm run build
npm run dev
```

## Checking If It's Working

### In Terminal

You should see logs from both servers:

```
[vite] files changed...
[wrangler] [200] POST /api/tasks/process
```

### In Browser DevTools (Network Tab)

When you click "Process Tasks":

1. Look for `POST /api/tasks/process`
2. Check Request Headers → should have `X-API-Key: sk-ant-...`
3. Response should be `200 OK` with JSON data

### Common Mistakes

❌ **Only running `npm run dev:vite`** → API requests will fail  
✅ **Run `npm run dev`** → Both servers start together

❌ **Not building first** → Functions won't exist in dist/  
✅ **Run `npm run build` first** → Functions copied to dist/

❌ **Wrong URL** → Using http://localhost:8787  
✅ **Correct URL** → Use http://localhost:3000 (Vite proxies to Wrangler)

## Alternative: Separate Terminals

If you prefer to run servers separately:

**Terminal 1 - Frontend:**

```bash
npm run dev:vite
```

**Terminal 2 - API Functions:**

```bash
npm run dev:wrangler
```

Then open http://localhost:3000

---

**Need more help?** Check `docs/development/LOCAL_API_DEVELOPMENT.md`
