/**
 * Echoprax Workout Generator API
 *
 * Uses Claude to generate structured workouts from natural language prompts.
 * Includes user settings for accurate duration estimation.
 * Premium feature - requires authentication.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '../../lib/logger';
import { authorizeSubscriptionFeature, type AuthEnv } from '../../lib/auth-middleware';

const log = createLogger('EchopraxGenerate');

interface Env extends AuthEnv {
  ANTHROPIC_API_KEY: string;
}

/**
 * User settings for workout generation - affects duration estimates
 */
interface UserTimingSettings {
  transitionPace: 'quick' | 'moderate' | 'relaxed';
  preferredRestPeriod: number;
  heavyLiftRestMultiplier: number;
  equipmentSetupSeconds: number;
}

interface UserSettings {
  partnerCount: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredDurationMinutes: number;
  timing: UserTimingSettings;
  includeWarmup: boolean;
  includeCooldown: boolean;
  countdownSeconds: number;
}

interface GenerateRequest {
  prompt: string;
  equipment: string[];
  constraints: {
    noJumping?: boolean;
    noSprinting?: boolean;
    noLyingDown?: boolean;
    lowCeiling?: boolean;
    mustBeQuiet?: boolean;
    outdoorAvailable?: boolean;
  };
  userSettings?: UserSettings;
  targetDuration?: number; // minutes - overrides userSettings.preferredDurationMinutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // overrides userSettings.fitnessLevel
}

interface GeneratedExercise {
  name: string;
  duration: number; // seconds
  reps?: number;
  sets: number;
  restAfter: number;
  notes?: string;
}

interface GeneratedWorkout {
  name: string;
  description: string;
  warmup?: GeneratedExercise[];
  main: GeneratedExercise[];
  cooldown?: GeneratedExercise[];
  totalDuration: number;
  targetBpm: {
    min: number;
    max: number;
    label: string;
  };
}

/**
 * Build system prompt with user settings context
 */
function buildSystemPrompt(settings?: UserSettings): string {
  const basePrompt = `You are an expert fitness coach creating workout routines. Generate structured, safe, and effective workouts based on user requests.

CRITICAL RULES:
1. Only include exercises that can be performed with the provided equipment
2. Respect ALL space constraints (no jumping if specified, etc.)
3. Use common exercise names that are widely recognized
4. Generate realistic, achievable workouts

EXERCISE TYPES:
- TIMED exercises: Use "duration" field (30-60 seconds typical). Omit "reps".
- REP-BASED exercises: Use "reps" field (8-15 typical). Set "duration" to estimated time (reps * 3-5 seconds).
- For rep-based, estimate duration as: reps * seconds_per_rep * sets
  - Light/bodyweight: 3 seconds per rep
  - Moderate weight: 4 seconds per rep  
  - Heavy compound: 5 seconds per rep

SETS CALCULATION:
- Each set takes: (duration OR reps*seconds_per_rep)
- Multiple sets: total_time = (set_duration * sets) + (rest_between_sets * (sets-1))
- Default rest between sets: 30-60 seconds for strength, 15-30 for circuits`;

  // Add settings-specific instructions
  let settingsInstructions = '';

  if (settings) {
    const lines: string[] = ['\n\nUSER PREFERENCES (adjust workout accordingly):'];

    // Partner workout - critical for duration
    if (settings.partnerCount > 1) {
      lines.push(`
PARTNER WORKOUT: ${settings.partnerCount} partners will alternate.
- Each exercise active time is multiplied by ${settings.partnerCount} (partners take turns)
- Example: 30s exercise with 2 partners = 60s total (each person does 30s)
- Factor this into totalDuration calculation`);
    }

    // Fitness level
    lines.push(`\nFITNESS LEVEL: ${settings.fitnessLevel}`);
    if (settings.fitnessLevel === 'beginner') {
      lines.push('- Use simpler exercises, lower rep ranges (8-10), longer rest periods');
      lines.push('- Include more detailed form notes');
    } else if (settings.fitnessLevel === 'advanced') {
      lines.push('- Can include complex movements, higher rep ranges (12-15), supersets');
      lines.push('- Shorter rest periods okay, higher intensity');
    }

    // Timing preferences
    const paceDescriptions = {
      quick: '10-15 seconds between exercises (fast-paced)',
      moderate: '20-30 seconds between exercises (standard)',
      relaxed: '30-45 seconds between exercises (take your time)',
    };
    lines.push(
      `\nTRANSITION PACE: ${settings.timing.transitionPace} - ${paceDescriptions[settings.timing.transitionPace]}`
    );

    lines.push(
      `BASE REST PERIOD: ${settings.timing.preferredRestPeriod} seconds between exercises`
    );

    const heavyRest = Math.round(
      settings.timing.preferredRestPeriod * settings.timing.heavyLiftRestMultiplier
    );
    lines.push(
      `HEAVY COMPOUND REST: ${heavyRest} seconds for deadlifts, squats, bench press (${settings.timing.heavyLiftRestMultiplier}x multiplier)`
    );

    if (settings.timing.equipmentSetupSeconds > 0) {
      lines.push(
        `EQUIPMENT SETUP: Add ${settings.timing.equipmentSetupSeconds} seconds for exercises requiring plate changes or equipment adjustment`
      );
    }

    // Structure
    if (!settings.includeWarmup) {
      lines.push('\nSKIP WARMUP: User will warm up separately');
    }
    if (!settings.includeCooldown) {
      lines.push('SKIP COOLDOWN: User will cool down separately');
    }

    // Countdown overhead
    lines.push(
      `\nCOUNTDOWN: Add ${settings.countdownSeconds} seconds per exercise for "get ready" countdown`
    );

    settingsInstructions = lines.join('\n');
  }

  const durationInstructions = `

TOTAL DURATION CALCULATION (be accurate!):
1. Sum all exercise active time:
   - Timed: duration * sets
   - Rep-based: (reps * seconds_per_rep) * sets
2. Add rest BETWEEN sets: rest_between_sets * (sets - 1) for each exercise
3. Add rest AFTER each exercise: restAfter for each exercise
4. Add transition time between exercises (based on pace)
5. Add equipment setup time if using barbells/plates
6. Add countdown time per exercise
7. If partner workout: multiply active time by partner count
8. Include warmup and cooldown if applicable

The totalDuration should reflect ACTUAL wall-clock time the workout will take.`;

  const outputFormat = `

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "name": "Workout Name",
  "description": "Brief description including estimated actual duration",
  "warmup": [
    { "name": "Exercise Name", "duration": 45, "sets": 1, "restAfter": 15, "notes": "Form cue" }
  ],
  "main": [
    { "name": "Exercise Name", "duration": 45, "reps": 12, "sets": 3, "restAfter": 30, "notes": "Form cue" }
  ],
  "cooldown": [
    { "name": "Exercise Name", "duration": 30, "sets": 1, "restAfter": 0, "notes": "Hold stretch" }
  ],
  "totalDuration": 1800,
  "targetBpm": { "min": 120, "max": 150, "label": "Moderate Intensity" }
}

FIELD NOTES:
- "duration": seconds (include for ALL exercises - estimate for rep-based)
- "reps": only for rep-based exercises, omit for pure timed exercises
- "sets": number of sets (1 for warmup/cooldown, 2-4 for main typically)
- "restAfter": seconds of rest AFTER completing all sets of this exercise
- "totalDuration": total workout time in SECONDS (be accurate based on calculations above)
- "targetBpm": music tempo recommendation based on intensity`;

  return basePrompt + settingsInstructions + durationInstructions + outputFormat;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // SECURITY: Validate authentication and subscription
  const authResult = await authorizeSubscriptionFeature(request, env, {
    requiredProducts: ['echoprax_extras', 'taco_club'],
  });

  if (!authResult.success) {
    return authResult.response;
  }

  const { auth } = authResult;

  // Check for API key
  if (!env.ANTHROPIC_API_KEY) {
    log.error('ANTHROPIC_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Service not configured' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Validate request
  if (!body.prompt || typeof body.prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  if (!body.equipment || !Array.isArray(body.equipment)) {
    return new Response(JSON.stringify({ error: 'equipment array is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Determine effective settings (request overrides userSettings)
  const effectiveSettings = body.userSettings;
  const targetDuration = body.targetDuration ?? effectiveSettings?.preferredDurationMinutes;
  const difficulty = body.difficulty ?? effectiveSettings?.fitnessLevel ?? 'intermediate';

  log.info('Generating workout', {
    promptLength: body.prompt.length,
    equipmentCount: body.equipment.length,
    partnerCount: effectiveSettings?.partnerCount ?? 1,
    targetDuration,
    difficulty,
  });

  // Build constraint description for Claude
  const constraintDescriptions: string[] = [];
  if (body.constraints?.noJumping) constraintDescriptions.push('NO jumping or plyometrics');
  if (body.constraints?.noSprinting) constraintDescriptions.push('NO sprinting or running');
  if (body.constraints?.noLyingDown)
    constraintDescriptions.push('NO exercises that require lying down');
  if (body.constraints?.lowCeiling) constraintDescriptions.push('LOW ceiling - no overhead jumps');
  if (body.constraints?.mustBeQuiet) constraintDescriptions.push('MUST be quiet - no loud impacts');
  if (body.constraints?.outdoorAvailable) constraintDescriptions.push('Outdoor space is available');

  // Identify heavy equipment for context
  const heavyEquipment = body.equipment.filter((e) =>
    [
      'barbell',
      'olympic_barbell',
      'squat_rack',
      'bench_press',
      'cable_machine',
      'smith_machine',
    ].includes(e.toLowerCase().replace(/\s+/g, '_'))
  );

  const userMessage = `Create a workout with these parameters:

USER REQUEST: "${body.prompt}"

AVAILABLE EQUIPMENT: ${body.equipment.join(', ')}
${heavyEquipment.length > 0 ? `HEAVY EQUIPMENT (requires setup time): ${heavyEquipment.join(', ')}` : ''}

SPACE CONSTRAINTS: ${constraintDescriptions.length > 0 ? constraintDescriptions.join('; ') : 'None'}

TARGET DURATION: ${targetDuration ? `${targetDuration} minutes` : 'User preference or ~30 minutes'}
DIFFICULTY LEVEL: ${difficulty}
${effectiveSettings?.partnerCount && effectiveSettings.partnerCount > 1 ? `PARTNERS: ${effectiveSettings.partnerCount} people alternating` : ''}

Generate the workout as JSON only. No explanation, no markdown code blocks, just the JSON object.
Remember to calculate totalDuration accurately based on all factors (sets, rest, transitions, partner multiplier if applicable).`;

  try {
    const anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = buildSystemPrompt(effectiveSettings);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: systemPrompt,
    });

    // Extract text content
    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    let workout: GeneratedWorkout;
    try {
      // Try to extract JSON if wrapped in markdown
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr
          .replace(/```json?\n?/g, '')
          .replace(/```$/g, '')
          .trim();
      }
      workout = JSON.parse(jsonStr);
    } catch {
      log.error('Failed to parse Claude response', { response: textContent.text });
      return new Response(JSON.stringify({ error: 'Failed to parse workout response' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate workout structure
    if (
      !workout.name ||
      !workout.main ||
      !Array.isArray(workout.main) ||
      workout.main.length === 0
    ) {
      log.error('Invalid workout structure', { workout });
      return new Response(JSON.stringify({ error: 'Invalid workout structure generated' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    log.info('Workout generated successfully', {
      name: workout.name,
      mainExercises: workout.main.length,
      totalDuration: workout.totalDuration,
      estimatedMinutes: Math.round(workout.totalDuration / 60),
      userId: auth.userId,
    });

    return new Response(JSON.stringify({ workout }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    log.error('Claude API error', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'Failed to generate workout' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
