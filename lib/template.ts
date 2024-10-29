// codegen.ts

import type { z } from 'zod'

export function createTemplate<TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	templateFunction: (context: z.infer<TSchema>) => string
) {
	return {
		schema,
		templateFunction
	}
}
