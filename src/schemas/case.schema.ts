import { z } from 'zod';

export const CaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(['draft', 'active', 'filed', 'resolved', 'closed']),
  claimAmount: z.number().positive(),
  defendant: z.string().min(1),
  filingDate: z.date().optional(),
  courtDate: z.date().optional(),
  description: z.string(),
});

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  type: z.enum(['document', 'photo', 'receipt', 'correspondence', 'witness']),
  title: z.string(),
  description: z.string(),
  dateAdded: z.date(),
  highlighted: z.boolean().default(false),
});

export const NoteSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  content: z.string(),
  highlightColor: z.enum(['yellow', 'blue', 'pink', 'green']).optional(),
  createdAt: z.date(),
});

export type Case = z.infer<typeof CaseSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Note = z.infer<typeof NoteSchema>;
