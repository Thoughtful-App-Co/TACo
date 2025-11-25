import { z } from 'zod';

// Theme token schema
export const ThemeSchema = z.object({
  name: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    textMuted: z.string(),
    border: z.string(),
  }),
  fonts: z.object({
    body: z.string(),
    heading: z.string(),
  }),
  spacing: z.object({
    xs: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
    xxl: z.string(),
  }),
  radii: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    organic: z.string(),
  }),
  shadows: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
  }),
});

export type Theme = z.infer<typeof ThemeSchema>;
