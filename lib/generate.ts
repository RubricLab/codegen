import { watch as fsWatch } from 'node:fs'
import { readdir } from 'node:fs/promises'

import type { z } from 'zod'
export async function generate<TSchema extends z.ZodTypeAny>({
	template,
	getContext,
	buildFile,
	watch = false,
	watchDir
}: {
	template: {
		schema: TSchema
		templateFunction: (context: z.infer<TSchema>) => string
	}
	getContext: (files: { name: string; path: string }[]) => Promise<z.input<TSchema>>
	buildFile: string
	watch?: boolean
	watchDir: string
}) {
	const codeGen = async () => {
		const files = await readdir(watchDir)

		const acceptedFileTypes = ['.ts', '.tsx']

		const filtered = files
			.filter(file => acceptedFileTypes.some(type => file.endsWith(type)))
			.map(file => {
				const ext = acceptedFileTypes.find(type => file.endsWith(type))
				if (!ext) {
					throw new Error(`No matching extension found for file: ${file}`)
				}
				return {
					name: file.split(ext)[0],
					path: `${watchDir}/${file.split(ext)[0]}`
				}
			})
			.filter((file): file is { name: string; path: string } => file !== undefined)

		const rawContext = await getContext(filtered)

		const parseResult = template.schema.safeParse(rawContext)
		if (!parseResult.success) {
			throw new Error(`Invalid context: ${parseResult.error.message}`)
		}
		const context = parseResult.data

		const code = template.templateFunction(context)

		await Bun.write(buildFile, code)
		console.log(`Generated code at ${buildFile}`)
	}

	await codeGen()

	if (watch) {
		fsWatch(watchDir, async () => {
			await codeGen()
		})
	}
}
