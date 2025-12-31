# 🚀 Prosper Quickstart

## How to Access Prosper

### Method 1: Direct URL (Recommended for Testing)

```
http://localhost:3002/prosper
```

(Note: Port may be 5173 or 3002 depending on your setup - check terminal output)
http://localhost:5173/prosper

````

### Method 2: From App Switcher

1. Go to `http://localhost:5173/`
2. Look for **Prosper** in the "NOW" section
3. Click the gold-colored card with 💰 icon

### Method 3: Direct Navigation

The app uses this route pattern: `/:appId`

- **Prosper:** `/prosper`
- **Tempo:** `/tempo`
- **Tenure:** `/tenure`
- etc.

---

## ⚡ Quick Test (2 Minutes)

### Test 1: Verify Prosper Loads

```bash
# Start dev server (if not running)
cd /home/shupp-dev/daemon/dev/TACo
npm run dev

# Open browser to:
http://localhost:3002/prosper
# (or check terminal for actual port)
````

**Expected:** You should see:

- Gold header with 💰 icon
- "Prosper - Your Worth & Career Journal" title
- Tab navigation: Dashboard | Your Worth | Journal | 360 Reviews | Export
- Dashboard with 4 stat cards (all showing 0)

---

### Test 2: Add Your First Salary Entry

1. Click **"Your Worth"** tab
2. Click **"Add Salary Entry"** button
3. Fill out form:
   ```
   Year: 2024
   Company: Test Corp
   Job Title: Software Engineer
   Base Salary: 120000
   SOC Code: 15-1252
   ```
4. Click **"Add Entry"**

**Expected:**

- Form closes
- Chart shows a single gold dot
- You'll see "Market data lookups remaining today: 24 / 25"
- After a moment, percentile bands should appear if BLS API succeeds

---

### Test 3: Complete a Quarterly Check-In

1. Click **"Journal"** tab
2. Click **"Start Q4 2025 Check-In"** (or current quarter)
3. Go through wizard:
   - **Step 1:** Enter company/title
   - **Step 2:** Drag satisfaction slider, pick mood
   - **Step 3:** Type accomplishments
   - **Step 4:** Challenges & goals
   - **Step 5:** Private notes (optional)
4. Click **"Complete Check-In"**

**Expected:**

- Wizard closes
- Timeline shows your check-in with mood color
- Dashboard stats update (1 journal entry)

---

## 🐛 Troubleshooting

### "I don't see Prosper in the app switcher"

**Solution:** Navigate directly to `http://localhost:5173/prosper`

The app should be registered in the apps array. If it's not showing:

1. Check browser console for errors
2. Try hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Clear localStorage: Open DevTools → Application → Local Storage → Clear All

### "Page is blank at /prosper"

**Check:**

1. Is dev server running? (`npm run dev`)
2. Check browser console for import errors
3. Try: `http://localhost:5173/tempo` - if Tempo works, it's a Prosper-specific issue

### "Market comparison isn't showing"

**This is normal if:**

- No SOC code was entered
- BLS API is rate-limited
- You're offline

**To test with real data:**
Use SOC code `15-1252` (Software Developers, Applications)

- This should fetch real BLS salary data
- You'll see percentile bands appear on the chart

### "My data disappeared"

**Data is stored in localStorage.** Check:

1. DevTools → Application → Local Storage → `http://localhost:5173`
2. Look for keys starting with `prosper_*`
3. If missing, you may have cleared storage

---

## 📊 Understanding the Data

### SOC Codes for Testing

Use these real codes to fetch market data:

| SOC Code | Occupation                        | Median Salary (approx) |
| -------- | --------------------------------- | ---------------------- |
| 15-1252  | Software Developers, Applications | $110k                  |
| 15-1251  | Computer Programmers              | $95k                   |
| 29-1141  | Registered Nurses                 | $77k                   |
| 11-2021  | Marketing Managers                | $140k                  |
| 13-2011  | Accountants and Auditors          | $77k                   |

### Rate Limits

- **Client-side (your IP):** 25 lookups/day
- **Shared cache:** Instant for previously-looked-up SOC codes
- **Server fallback:** 500/day shared pool (not implemented yet)

---

## ✅ Success Checklist

- [ ] Prosper loads at `/prosper`
- [ ] Dashboard shows 4 stat cards
- [ ] Can navigate between tabs
- [ ] Can add salary entry
- [ ] Chart renders with data point
- [ ] Can complete check-in wizard
- [ ] Check-in appears in timeline
- [ ] Data persists on page refresh

---

## 🎯 What to Test

1. **Salary Chart:**
   - Add 3-5 entries across different years
   - Toggle "Show Market Comparison" on/off
   - Try different SOC codes
   - Switch between per-year and range modes

2. **Journal:**
   - Complete a check-in
   - Try all mood levels
   - Add quick accomplishments
   - Verify timeline sorting (newest first)

3. **Data Persistence:**
   - Add data
   - Refresh page
   - Check data is still there
   - Clear localStorage → verify it resets

---

## 🆘 Still Having Issues?

**Check these files exist:**

```bash
ls -la src/components/prosper/
# Should show:
# - ProsperApp.tsx
# - YourWorth.tsx
# - Journal.tsx
# - index.ts
```

**Verify imports:**

```bash
grep "ProsperApp" src/App.tsx
# Should show import statement
```

**Check browser console:**

1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share error messages if stuck

---

**URL to test:** `http://localhost:5173/prosper` 🚀
