import type { z } from 'zod'

export function createTemplate<TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	templateFunction: (context: z.infer<TSchema>, options?: { path: string }) => string
) {
	return {
		schema,
		templateFunction
	}
}
