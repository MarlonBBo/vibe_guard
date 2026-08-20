import { z } from 'zod';

export const createRepositoryRequestSchema = z.object({
  url: z.string(),
}).strict();

export const repositoryIdParamSchema = z.object({
  id: z.string().uuid(),
}).strict();
