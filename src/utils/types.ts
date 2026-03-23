import { z } from 'zod';

export const appLocaleSchema = z.enum(['en']);
export type AppLocale = z.infer<typeof appLocaleSchema>;
