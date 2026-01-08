# API Integrations

Setup guides for external services used in Echoprax.

---

## ExerciseDB (RapidAPI)

**Purpose:** Exercise library with 1300+ exercises, GIFs, and instructions

**Cost:** $9/month (Basic Plan)

- 10,000 requests/day
- Exercise database access
- GIF images hosted on CDN

### Setup

1. **Sign up for RapidAPI:**
   - Go to https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
   - Create account and subscribe to Basic Plan

2. **Get API Key:**
   - Navigate to "Endpoints" tab
   - Copy your `X-RapidAPI-Key` from the code snippet

3. **Add to Cloudflare Pages:**

   ```bash
   # Local development (.dev.vars)
   EXERCISEDB_API_KEY=your_api_key_here

   # Production (Cloudflare Pages dashboard)
   Settings → Environment Variables → Production
   EXERCISEDB_API_KEY = your_api_key_here
   ```

### API Endpoints Used

```bash
# Get all exercises
GET https://exercisedb.p.rapidapi.com/exercises

# Get exercises by body part
GET https://exercisedb.p.rapidapi.com/exercises/bodyPart/{bodyPart}
# bodyPart: back, cardio, chest, lower arms, lower legs, neck, shoulders, upper arms, upper legs, waist

# Get exercises by equipment
GET https://exercisedb.p.rapidapi.com/exercises/equipment/{equipment}
# equipment: assisted, band, barbell, body weight, bosu ball, cable, dumbbell, elliptical machine, ez barbell, hammer, kettlebell, leverage machine, medicine ball, olympic barbell, resistance band, roller, rope, skierg machine, sled machine, smith machine, stability ball, stationary bike, stepmill machine, tire, trap bar, upper body ergometer, weighted, wheel roller

# Get exercise by ID
GET https://exercisedb.p.rapidapi.com/exercises/exercise/{id}

# Search exercises
GET https://exercisedb.p.rapidapi.com/exercises/name/{name}
```

### Response Format

```json
{
  "bodyPart": "waist",
  "equipment": "body weight",
  "gifUrl": "https://v2.exercisedb.io/image/0001.gif",
  "id": "0001",
  "name": "3/4 sit-up",
  "target": "abs",
  "secondaryMuscles": ["hip flexors", "lower back"],
  "instructions": [
    "Lie flat on your back with your knees bent and feet flat on the ground.",
    "Place your hands behind your head with your elbows pointing outwards.",
    "Engaging your abs, slowly lift your upper body off the ground, curling forward until your torso is at a 45-degree angle.",
    "Pause for a moment at the top, then slowly lower your upper body back down to the starting position.",
    "Repeat for the desired number of repetitions."
  ]
}
```

### Rate Limits

- **Basic Plan**: 10,000 requests/day
- **Caching Strategy**: Cache responses for 24 hours in Cloudflare Workers
- **Burst Protection**: 10 requests/second max

### Testing

```bash
# Test API key locally
curl -X GET "https://exercisedb.p.rapidapi.com/exercises/bodyPart/chest" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: exercisedb.p.rapidapi.com"
```

---

## Whoop API

**Purpose:** Sync workout sessions, pull recovery/strain/HRV data

**Cost:** Free (requires Whoop membership for users)

- OAuth 2.0 authentication
- Developer-friendly REST API
- Real-time recovery metrics

### Setup

1. **Apply for Developer Access:**
   - Go to https://developer.whoop.com
   - Fill out application form (typically approved in 24-48 hours)
   - Describe Echoprax as "open-source fitness taskmaster app"

2. **Create OAuth Application:**
   - Dashboard → Create New App
   - **App Name**: Echoprax
   - **Redirect URI**: `https://yourdomain.com/api/wearables/whoop-callback`
   - **Scopes**:
     - `read:recovery` - Read recovery data
     - `read:cycles` - Read sleep/strain cycles
     - `read:workout` - Read workout data
     - `write:workout` - Create workout entries

3. **Get Credentials:**
   - Copy `Client ID` and `Client Secret`

4. **Add to Cloudflare Pages:**

   ```bash
   # Local development (.dev.vars)
   WHOOP_CLIENT_ID=your_client_id
   WHOOP_CLIENT_SECRET=your_client_secret
   WHOOP_REDIRECT_URI=http://localhost:5173/api/wearables/whoop-callback

   # Production
   WHOOP_CLIENT_ID=your_client_id
   WHOOP_CLIENT_SECRET=your_client_secret
   WHOOP_REDIRECT_URI=https://yourdomain.com/api/wearables/whoop-callback
   ```

### OAuth Flow

```typescript
// 1. Redirect user to Whoop authorization
const authUrl =
  `https://api.prod.whoop.com/oauth/oauth2/auth?` +
  `client_id=${WHOOP_CLIENT_ID}&` +
  `redirect_uri=${WHOOP_REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=read:recovery read:cycles read:workout write:workout`;

window.location.href = authUrl;

// 2. Handle callback (functions/api/wearables/whoop-callback.ts)
const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: code, // from URL param
    client_id: WHOOP_CLIENT_ID,
    client_secret: WHOOP_CLIENT_SECRET,
    redirect_uri: WHOOP_REDIRECT_URI,
  }),
});

// 3. Store tokens in database
const { access_token, refresh_token, expires_in } = await response.json();
```

### API Endpoints Used

```bash
# Get user profile
GET https://api.prod.whoop.com/developer/v1/user/profile/basic
Authorization: Bearer {access_token}

# Get recovery data (last 7 days)
GET https://api.prod.whoop.com/developer/v1/recovery?start=2026-01-01&end=2026-01-08
Authorization: Bearer {access_token}

# Create workout entry
POST https://api.prod.whoop.com/developer/v1/activity/workout
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "sport_id": 63, // See sport ID mapping
  "start": "2026-01-05T10:00:00Z",
  "end": "2026-01-05T10:45:00Z",
  "timezone_offset": "-08:00"
}
```

### Sport ID Mapping

Common workout types:

- `0` - Running
- `1` - Cycling
- `63` - Functional Fitness / CrossFit
- `44` - HIIT
- `71` - Weightlifting
- `52` - Yoga

Full list: https://developer.whoop.com/api#tag/Activity/Sport-IDs

### Rate Limits

- **100 requests/hour** per user
- Burst: 10 requests/second
- Recovery data cached for 1 hour

### Testing

```bash
# Get recovery data
curl -X GET "https://api.prod.whoop.com/developer/v1/recovery?start=2026-01-01&end=2026-01-08" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Garmin Connect API

**Purpose:** Sync workout sessions as activities

**Cost:** Free (requires Garmin device for users)

- OAuth 1.0a authentication
- Activity upload
- No recovery metrics (device-dependent)

### Setup

**⚠️ Important:** Garmin API approval takes 2-4 weeks. Apply early.

1. **Apply for Developer Access:**
   - Go to https://developer.garmin.com
   - Create account → Request API Access
   - **Application Type**: Health & Fitness
   - **Purpose**: Open-source workout tracking app
   - Wait for approval email

2. **Create Application:**
   - Developer Dashboard → Create New App
   - **App Name**: Echoprax
   - **Callback URL**: `https://yourdomain.com/api/wearables/garmin-callback`
   - **APIs Requested**: Health API (Activities)

3. **Get Credentials:**
   - Copy `Consumer Key` and `Consumer Secret`

4. **Add to Cloudflare Pages:**

   ```bash
   # Local development (.dev.vars)
   GARMIN_CONSUMER_KEY=your_consumer_key
   GARMIN_CONSUMER_SECRET=your_consumer_secret
   GARMIN_CALLBACK_URL=http://localhost:5173/api/wearables/garmin-callback

   # Production
   GARMIN_CONSUMER_KEY=your_consumer_key
   GARMIN_CONSUMER_SECRET=your_consumer_secret
   GARMIN_CALLBACK_URL=https://yourdomain.com/api/wearables/garmin-callback
   ```

### OAuth 1.0a Flow

**Note:** Garmin uses OAuth 1.0a (older standard), requires request signing.

```typescript
// 1. Get request token
const requestTokenResponse = await fetch(
  'https://connectapi.garmin.com/oauth-service/oauth/request_token',
  {
    method: 'POST',
    headers: {
      Authorization: generateOAuth1Header({
        method: 'POST',
        url: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
        consumerKey: GARMIN_CONSUMER_KEY,
        consumerSecret: GARMIN_CONSUMER_SECRET,
        callback: GARMIN_CALLBACK_URL,
      }),
    },
  }
);

// 2. Redirect user to authorization
const authUrl = `https://connect.garmin.com/oauthConfirm?` + `oauth_token=${requestToken}`;

// 3. Exchange for access token (in callback)
const accessTokenResponse = await fetch(
  'https://connectapi.garmin.com/oauth-service/oauth/access_token',
  {
    method: 'POST',
    headers: {
      Authorization: generateOAuth1Header({
        method: 'POST',
        url: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
        consumerKey: GARMIN_CONSUMER_KEY,
        consumerSecret: GARMIN_CONSUMER_SECRET,
        token: requestToken,
        tokenSecret: requestTokenSecret,
        verifier: oauthVerifier, // from callback URL
      }),
    },
  }
);
```

### API Endpoints Used

```bash
# Upload activity (FIT file or manual entry)
POST https://connectapi.garmin.com/upload-service/upload/.fit
Authorization: OAuth 1.0a signature
Content-Type: multipart/form-data

# Manual activity creation
POST https://connectapi.garmin.com/activity-service/activity
Authorization: OAuth 1.0a signature
Content-Type: application/json

{
  "activityName": "Echoprax HIIT Workout",
  "activityTypeKey": "strength_training",
  "startTimeGMT": "2026-01-05T10:00:00Z",
  "durationInSeconds": 2700,
  "distanceInMeters": 0
}
```

### Activity Type Mapping

- `strength_training` - General strength
- `cardio_training` - HIIT, cardio
- `training` - General workout
- `yoga` - Yoga/stretching
- `running` - Running workouts

Full list: https://developer.garmin.com/gc-developer-program/activity-types

### Rate Limits

- **120 requests/minute** per user
- Activity uploads: Max 50 per day per user

### OAuth 1.0a Signing Library

Garmin requires OAuth 1.0a request signing. Use a library:

```bash
pnpm add oauth-1.0a crypto-js
```

```typescript
import OAuth from 'oauth-1.0a';
import crypto from 'crypto-js';

const oauth = OAuth({
  consumer: {
    key: GARMIN_CONSUMER_KEY,
    secret: GARMIN_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => {
    return crypto.HmacSHA1(baseString, key).toString(crypto.enc.Base64);
  },
});

const authHeader = oauth.toHeader(oauth.authorize(requestData, tokenData));
```

### Testing

Manual activity creation is easiest for testing (no FIT file required).

---

## Web Speech Synthesis API (TTS)

**Purpose:** Voice coaching during workouts

**Cost:** Free (built into browsers)

- No API key required
- Offline-capable
- Cross-platform support

### Browser Support

| Browser            | Support | Quality | Voices Available      |
| ------------------ | ------- | ------- | --------------------- |
| **Chrome/Edge**    | ✅ Full | High    | 50+ (network + local) |
| **Firefox**        | ✅ Full | Medium  | 10+ (mostly local)    |
| **Safari**         | ✅ Full | High    | 30+ (high-quality)    |
| **iOS Safari**     | ✅ Full | High    | 30+ (Siri voices)     |
| **Android Chrome** | ✅ Full | High    | 40+ (Google voices)   |

### Basic Usage

```typescript
const synth = window.speechSynthesis;

// Get available voices
const voices = synth.getVoices();
console.log(voices); // List of SpeechSynthesisVoice objects

// Speak text
const utterance = new SpeechSynthesisUtterance('Get ready for burpees!');
utterance.voice = voices[0]; // Select preferred voice
utterance.volume = 0.8; // 0.0 to 1.0
utterance.rate = 1.0; // 0.1 to 10.0 (1.0 = normal speed)
utterance.pitch = 1.0; // 0.0 to 2.0

synth.speak(utterance);
```

### Voice Selection Strategy

```typescript
// Prefer high-quality voices
const preferredVoices = [
  'Google US English', // Android
  'Samantha', // iOS/macOS
  'Microsoft David Desktop', // Windows
  'Google UK English Male', // Cross-platform
];

function selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice {
  for (const preferred of preferredVoices) {
    const voice = voices.find((v) => v.name.includes(preferred));
    if (voice) return voice;
  }

  // Fallback: first English voice
  return voices.find((v) => v.lang.startsWith('en')) || voices[0];
}
```

### User Preferences

Allow users to customize:

- **Voice**: Dropdown of available voices
- **Volume**: Slider 0-100%
- **Speed**: Slider 0.5x - 2.0x
- **Pitch**: Slider 0.5 - 2.0 (optional, most users won't change)

Stored in localStorage:

```typescript
localStorage.setItem('echoprax_tts_voice', 'Samantha');
localStorage.setItem('echoprax_tts_volume', '0.8');
localStorage.setItem('echoprax_tts_rate', '1.1');
```

### Limitations

- **Interruption**: Calling `speak()` queues utterances (use `cancel()` to clear)
- **Mobile**: May require user gesture to start (iOS especially)
- **Background**: May pause if app loses focus (PWA issue)
- **Offline**: Local voices work offline, network voices don't

### Workarounds

```typescript
// Resume if paused (mobile fix)
if (synth.paused) {
  synth.resume();
}

// Prevent iOS sleep during workout
const wakeLock = await navigator.wakeLock?.request('screen');

// Queue management
synth.cancel(); // Clear queue before speaking new cue
synth.speak(utterance); // Now speaks immediately
```

---

## Anthropic Claude API (Workout Generation)

**Purpose:** Parse user prompts into structured workouts

**Cost:** Pay-per-use

- Claude Haiku: $0.25 / 1M input tokens, $1.25 / 1M output tokens
- ~500 tokens per workout generation (~$0.001 per workout)

### Setup

1. **Get API Key:**
   - Go to https://console.anthropic.com
   - Create account → API Keys → Create Key
   - Copy key

2. **Add to Cloudflare Pages:**

   ```bash
   # Local development (.dev.vars)
   ANTHROPIC_API_KEY=sk-ant-...

   # Production
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### System Prompt (functions/api/workout-ai.ts)

```typescript
const SYSTEM_PROMPT = `You are a certified personal trainer. Parse the user's workout request into a structured JSON workout plan.

Rules:
1. Match exercise names to ExerciseDB taxonomy (e.g., "burpees", "squats", "push-ups")
2. Estimate realistic durations/reps based on fitness level
3. Include warmup (5-10 min) and cooldown (5 min) for workouts >20 min
4. Rest periods: 15-30s for cardio, 30-60s for strength
5. Recommend BPM range based on workout intensity

Output JSON only, no markdown.`;

const USER_PROMPT = `Create a workout: ${userInput}`;

const response = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 1024,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: USER_PROMPT }],
});
```

### Expected Output Format

```json
{
  "name": "30-Minute Full Body HIIT",
  "warmup": [
    { "exercise": "jumping jacks", "duration": 60, "rest": 15 },
    { "exercise": "arm circles", "duration": 30, "rest": 0 }
  ],
  "main": [
    { "exercise": "burpees", "duration": 45, "rest": 15, "sets": 3 },
    { "exercise": "mountain climbers", "duration": 45, "rest": 15, "sets": 3 },
    { "exercise": "push-ups", "reps": 15, "rest": 30, "sets": 3 }
  ],
  "cooldown": [
    { "exercise": "standing quad stretch", "duration": 30, "rest": 0 },
    { "exercise": "standing hamstring stretch", "duration": 30, "rest": 0 }
  ],
  "bpm": { "min": 140, "max": 170, "label": "High intensity" }
}
```

### Rate Limits

- **Tier 1 (free)**: 50 requests/day, 5 requests/minute
- **Tier 2**: 1000 requests/day after billing setup

### Cost Estimation

Average workout generation:

- Input: ~200 tokens (system + user prompt)
- Output: ~300 tokens (JSON workout)
- Cost: ~$0.0004 per generation

100 workouts/day = **$0.04/day** = **$1.20/month**

---

## Environment Variables Summary

```bash
# .dev.vars (local development)
EXERCISEDB_API_KEY=your_rapidapi_key
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret
WHOOP_REDIRECT_URI=http://localhost:5173/api/wearables/whoop-callback
GARMIN_CONSUMER_KEY=your_garmin_key
GARMIN_CONSUMER_SECRET=your_garmin_secret
GARMIN_CALLBACK_URL=http://localhost:5173/api/wearables/garmin-callback
ANTHROPIC_API_KEY=sk-ant-...
```

**Production:** Set same variables in Cloudflare Pages dashboard (update redirect URIs to production domain).

---

## Troubleshooting

### ExerciseDB

**Issue:** "Invalid API Key" error

- **Fix:** Ensure key is set in `.dev.vars` or Cloudflare environment variables
- **Test:** `curl` the API directly with your key

**Issue:** GIFs not loading

- **Fix:** ExerciseDB GIFs are hosted on `v2.exercisedb.io` - ensure CSP allows this domain

### Whoop

**Issue:** OAuth redirect fails

- **Fix:** Check redirect URI matches exactly in Whoop developer dashboard
- **Fix:** Ensure `http://` vs `https://` matches

**Issue:** "Invalid scope" error

- **Fix:** Verify scopes in Whoop app settings match requested scopes

### Garmin

**Issue:** OAuth signature invalid

- **Fix:** Ensure OAuth 1.0a signing library is correctly implemented
- **Fix:** Check timestamp/nonce generation

**Issue:** Application not approved

- **Fix:** Wait 2-4 weeks, contact Garmin developer support if delayed

### TTS

**Issue:** Voice not speaking

- **Fix:** User gesture required on iOS - add "Test Voice" button on settings page
- **Fix:** Check `speechSynthesis.speaking` state before calling `speak()`

**Issue:** Voice cuts out mid-workout

- **Fix:** Request wake lock (`navigator.wakeLock.request('screen')`)
- **Fix:** Resume synthesis if paused: `synth.resume()`

---

## Security Best Practices

1. **Never expose API keys in frontend code** - always proxy through Cloudflare Functions
2. **Encrypt wearable OAuth tokens** in database (use Cloudflare's D1 encryption)
3. **Validate redirect URIs** to prevent OAuth hijacking
4. **Rate limit API endpoints** to prevent abuse (use Cloudflare rate limiting)
5. **Sanitize user input** before sending to Claude (prevent prompt injection)

---

## Next Steps

1. Sign up for ExerciseDB on RapidAPI
2. Apply for Whoop developer access
3. Apply for Garmin developer access (start early!)
4. Get Anthropic API key
5. Test each integration locally before deploying

---

See [ARCHITECTURE.md](./ARCHITECTURE.md) for implementation details.
