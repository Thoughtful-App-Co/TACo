// Cloudflare Pages Function to inject dynamic meta tags for social media crawlers
// This runs on the edge and modifies the HTML response for crawler user agents

const apps = {
  nurture: {
    name: 'Nurture',
    description: 'Relationship CRM',
    elevatorPitch:
      'Never forget a birthday or let a friendship fade. Nurture helps you maintain meaningful relationships with gentle reminders and interaction tracking.',
  },
  justincase: {
    name: 'JustInCase',
    description: 'Small claims helper',
    elevatorPitch:
      'Document everything, stress about nothing. JustInCase helps you build airtight cases for small claims court with guided evidence collection.',
  },
  tempo: {
    name: 'Tempo',
    description: 'AI task timer',
    elevatorPitch:
      "Work with your natural rhythm, not against it. Tempo uses AI to learn when you're most productive and schedules tasks accordingly.",
  },
  friendly: {
    name: 'FriendLy',
    description: 'Friendship calendar',
    elevatorPitch:
      'Coordinate hangouts without the group chat chaos. FriendLy finds the perfect time for everyone to meet up.',
  },
  augment: {
    name: 'Augment',
    description: 'IO psychology jobs',
    elevatorPitch:
      'Find work that actually fits you. Augment matches your personality and work style to careers using IO psychology principles.',
  },
  manifest: {
    name: 'Manifest',
    description: 'Picky matchmaking',
    elevatorPitch:
      'Dating for people with standards. Manifest uses detailed compatibility matching for those who know exactly what they want.',
  },
  lol: {
    name: 'LoL',
    description: 'Gamified chores',
    elevatorPitch:
      'Turn household tasks into a game everyone wants to play. LoL makes chores fun with rewards, streaks, and friendly competition.',
  },
};

// User agents that are social media crawlers
const crawlerUserAgents = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Pinterest',
  'Slackbot',
  'vkShare',
  'W3C_Validator',
  'bsky', // Bluesky
  'Bluesky',
  'WhatsApp',
  'TelegramBot',
  'Discordbot',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return crawlerUserAgents.some((crawler) =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const userAgent = request.headers.get('user-agent') || '';

  // API routes should be handled by specific function files, not this middleware
  // For API requests, we need to return early to avoid interference
  if (path.startsWith('/api/')) {
    // Let Cloudflare Pages routing handle API endpoints
    // The function files in functions/api/ will handle these requests
    try {
      const response = await next();
      return response;
    } catch (error) {
      console.error('API route error:', error);
      throw error;
    }
  }

  // Get the original response
  const response = await next();

  // Only modify HTML responses for app routes when accessed by crawlers
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Check if this is an app route
  const appId = path.replace('/', '').toLowerCase();
  const app = apps[appId];

  // If not an app route or not a crawler, return original response
  if (!app || !isCrawler(userAgent)) {
    return response;
  }

  // Get the HTML and modify meta tags
  let html = await response.text();

  const baseUrl = url.origin;
  const appUrl = `${baseUrl}/${appId}`;
  const title = `${app.name} | Thoughtful App Co.`;
  const description = app.elevatorPitch;

  // Replace meta tags
  html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

  html = html.replace(
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${description}">`
  );

  // Open Graph tags
  html = html.replace(
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${title}">`
  );

  html = html.replace(
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${description}">`
  );

  html = html.replace(
    /<meta property="og:url" content=".*?">/,
    `<meta property="og:url" content="${appUrl}">`
  );

  // Twitter tags
  html = html.replace(
    /<meta property="twitter:title" content=".*?">/,
    `<meta property="twitter:title" content="${title}">`
  );

  html = html.replace(
    /<meta property="twitter:description" content=".*?">/,
    `<meta property="twitter:description" content="${description}">`
  );

  html = html.replace(
    /<meta property="twitter:url" content=".*?">/,
    `<meta property="twitter:url" content="${appUrl}">`
  );

  return new Response(html, {
    headers: response.headers,
    status: response.status,
  });
}
