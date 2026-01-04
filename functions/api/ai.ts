import { Anthropic } from '@anthropic-ai/sdk';
import { authorizeSubscriptionFeature } from '../lib/auth-middleware';
import { apiLog } from '../lib/logger';

// Cloudflare Pages Function for /api/ai
// Handles Claude AI requests for task refinement and organization

interface Env {
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  AUTH_DB: any;
  BILLING_DB: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  apiLog.info('API Key available:', !!env.ANTHROPIC_API_KEY);

  // SECURITY: Validate authentication and check tempo_extras subscription
  const authResult = await authorizeSubscriptionFeature(request, env, {
    requiredProducts: ['tempo_extras'],
  });

  if (!authResult.success) {
    return authResult.response;
  }

  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  try {
    const { action, data } = await request.json();

    if (action === 'refineTask') {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Refine this task description to be clear and actionable. Extract a title and optional description. Estimate difficulty on a scale of 1-100:
          
          ${data.taskInput}
          
          Respond in JSON format:
          {
            "title": "Brief, clear title",
            "description": "Detailed description if needed",
            "difficulty": number (1-100)
          }`,
          },
        ],
      });

      try {
        const content = message.content[0].type === 'text' ? message.content[0].text : null;
        if (!content) {
          throw new Error('No text content in AI response');
        }
        // Validate that we got valid JSON
        JSON.parse(content);
        return new Response(JSON.stringify({ content }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        apiLog.error('Invalid JSON response from Claude:', message.content);
        return new Response(JSON.stringify({ error: 'Invalid response format from AI' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'organizeTasks') {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Organize these tasks into logical groups for efficient completion. Consider task relationships and dependencies:
          
          ${JSON.stringify(data.tasks)}
          
          Respond with JSON array of groups:
          [{
            "id": "unique-id",
            "tasks": ["task-id-1", "task-id-2"],
            "name": "Group name"
          }]`,
          },
        ],
      });

      try {
        const content = message.content[0].type === 'text' ? message.content[0].text : null;
        if (!content) {
          throw new Error('No text content in AI response');
        }
        // Validate that we got valid JSON
        JSON.parse(content);
        return new Response(JSON.stringify({ content }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        apiLog.error('Invalid JSON response from Claude:', message.content);
        return new Response(JSON.stringify({ error: 'Invalid response format from AI' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    apiLog.error('API Error:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return new Response(
        JSON.stringify({ error: 'API authentication failed. Please check API key configuration.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
