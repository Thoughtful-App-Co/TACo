/**
 * Pricing Module - Type Definitions
 */

export interface App {
  id: string;
  name: string;
  color: string;
  logo: string;
}

export interface TooltipContent {
  title: string;
  description: string;
  features: string[];
  why?: string; // Optional "why" explanation for non-technical users
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type TacoClubTier = 'none' | 'monthly' | 'lifetime';
