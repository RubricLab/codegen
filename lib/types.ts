export type ValueFunction = (context: {
	files: string[]
	watchDir: string
}) => string

// Helper type to count the number of placeholders in the template string
export type PlaceholderCount<
	S extends string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Count extends any[] = []
> = S extends `${infer _}$${infer Rest}`
	? PlaceholderCount<Rest, [unknown, ...Count]>
	: Count['length']

// Enforce that the number of placeholders matches the number of values
export type ValidateTemplate<
	Template extends string,
	Values extends ValueFunction[]
> = PlaceholderCount<Template> extends Values['length']
	? Template
	: {
			ERROR: 'The number of placeholders in the template does not match the number of value functions'
			PLACEHOLDERS_EXPECTED: PlaceholderCount<Template>
			VALUES_PROVIDED: Values['length']
		}
