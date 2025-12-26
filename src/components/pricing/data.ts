/**
 * Pricing Module - Static Data
 * Contains all pricing plans, apps, tooltips, and FAQ content
 */

import type { App, TooltipContent, FAQItem } from './types';

export const availableApps: App[] = [
  { id: 'tempo', name: 'Tempo', color: '#5E6AD2', logo: '/tempo/tempo_logo.png' },
  { id: 'tenure', name: 'Tenure', color: '#9333EA', logo: '/tenure/tenure_logo.png' },
  { id: 'nurture', name: 'Nurture', color: '#2D5A45', logo: '' },
];

export const tooltipContent: Record<string, TooltipContent> = {
  sync: {
    title: 'Sync & Backup',
    description: 'Keep your data safe and accessible across all your devices.',
    features: [
      'Automatic cloud backups',
      'Cross-device sync in real-time',
      'Email backup on cancellation',
      '2-year cold storage if you leave',
      'Priority support',
    ],
    why: 'Running servers costs real money—storage, bandwidth, and maintenance. We pass those infrastructure costs directly to you with no markup.',
  },
  // All apps sync tooltip
  allAppsSync: {
    title: 'All Apps Sync & Backup',
    description: 'Everything backed up and synced across all your devices.',
    features: [
      'Covers all current and future TACo apps',
      'Automatic cloud backups for everything',
      'Cross-device sync in real-time',
      'Email backup on cancellation',
      '2-year cold storage if you leave',
      'Best value - future apps included',
    ],
    why: 'Running servers costs real money—storage, bandwidth, and maintenance. We pass those infrastructure costs directly to you with no markup.',
  },
  // Individual app sync tooltips
  tempoSync: {
    title: 'Tempo Sync & Backup',
    description: 'Your tasks, sessions, and brain dumps backed up and synced.',
    features: [
      'All Tempo data in the cloud',
      'Sync across desktop, mobile, tablet',
      'Never lose a task or thought',
      'Works offline, syncs when online',
    ],
  },
  tenureSync: {
    title: 'Tenure Sync & Backup',
    description: 'Your resumes, applications, and job pipeline always safe.',
    features: [
      'All Tenure data backed up',
      'Resume versions synced everywhere',
      'Job applications tracked across devices',
      'Interview prep notes accessible anywhere',
    ],
  },
  nurtureSync: {
    title: 'Nurture Sync & Backup',
    description: 'Your contacts and relationships protected and available.',
    features: [
      'Contact database in the cloud',
      'Relationship notes synced',
      'Never lose touch with your network',
      'Access from any device',
    ],
  },
  extras: {
    title: 'App Extras',
    description: 'Premium features powered by AI and advanced analytics.',
    features: [
      'Managed AI (no API key needed)',
      'Advanced processing & insights',
      'Usage-based or monthly billing',
      'Cancel anytime',
    ],
    why: 'Developer time to build and maintain features, plus inference costs for AI processing. You can BYOK (free) or pay us to manage it for you.',
  },
  // App-specific extras tooltips
  tempoExtras: {
    title: 'Tempo Extras',
    description: 'AI-powered task management and productivity insights.',
    features: [
      'Managed AI for task refinement',
      'Brain dump processing & organization',
      'Smart task difficulty estimation',
      'Auto-grouping by dependencies',
      'Usage analytics & insights',
      'Priority API access',
    ],
    why: "Development time to build smart task features, plus inference costs for Claude API processing. We handle the complexity so you don't have to.",
  },
  tenureExtras: {
    title: 'Tenure Extras',
    description: 'Professional resume transformation and career tools.',
    features: [
      '5 AI resume mutations included',
      'Job-specific tailoring',
      'Role archetype transformations',
      'ATS optimization',
      'Additional mutations available',
      'Export in multiple formats',
    ],
    why: 'Developer time building resume intelligence, plus inference costs for each AI-powered transformation and job matching analysis.',
  },
  nurtureExtras: {
    title: 'Nurture Extras',
    description: 'Relationship management and networking intelligence.',
    features: [
      'AI-powered contact insights',
      'Relationship health tracking',
      'Smart reminder system',
      'Network analytics',
      'Integration with calendar & email',
    ],
    why: 'Development time for relationship intelligence features, plus inference costs for contact enrichment and networking analysis.',
  },
  tacoClub: {
    title: 'Loco TACo Club',
    description: 'Our way of rewarding early believers who help build this ecosystem.',
    features: [
      'Lifetime benefits after 24 months',
      '75% off all Extras forever',
      'Free Sync & Backup for all apps',
      'Founding member exclusive merch',
      'Direct influence on our roadmap',
      'Only 10,000 spots available',
    ],
    why: "We want to reward our early adopters and believers. Your support now helps us build the foundation, and in return you get legacy benefits forever. You're not just a customer—you're part of creating this ecosystem.",
  },
};

export const faqItems: FAQItem[] = [
  {
    question: 'Where is my data stored?',
    answer:
      "In your browser's local storage. Everything runs locally—no servers required for basic features. You can export anytime as CSV or JSON.",
  },
  {
    question: 'What does "BYOK" mean?',
    answer:
      'Bring Your Own (API) Key. Some AI features let you use your own Anthropic API key, stored locally in your browser. We never see it and assume no liability for its use. Alternatively, pay for managed AI and we handle the keys.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'Free tier: Your data stays in your browser forever. Paid backup: We email you a final backup, then archive your cloud data for 2 years (cold storage). You can return anytime and restore.',
  },
  {
    question: 'Can I get my data out easily?',
    answer:
      'Always. Every app has free CSV and JSON export, even on the free tier. No data lock-in, ever.',
  },
  {
    question: 'What if I cancel Loco TACo Club before 24 months?',
    answer:
      'You lose active perks (sync, discounts, Discord) but keep any physical items already shipped. If you return, you pick up where you left off.',
  },
  {
    question: 'Can I buy out my Loco TACo membership early?',
    answer: 'Yes! Pay the remaining balance (prorated) to unlock lifetime status immediately.',
  },
  {
    question: 'What\'s a "mutation" in Tenure?',
    answer:
      'A mutation is an AI-powered resume transformation—either tailored for a specific job posting or rebuilt for a role archetype (e.g., "Project Manager" or "Lead Developer" version of your resume).',
  },
  {
    question: 'Do you sell my data?',
    answer:
      "Never. We're user-supported, not advertiser-supported. Your data stays in your browser unless you opt into cloud sync—and even then, it's yours to export anytime.",
  },
];
