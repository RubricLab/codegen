import { watch as fsWatch } from 'node:fs'
import { readdir } from 'node:fs/promises'
import type { z } from 'zod'
import type { createTemplate } from './template'

export async function generate<TSchema extends z.ZodTypeAny>({
	template,
	getContext,
	buildFile,
	watch = false,
	recursive = false,
	watchDir,
	acceptedFileTypes = ['.ts', '.tsx']
}: {
	template: ReturnType<typeof createTemplate>
	getContext: (files: { name: string; path: string }[]) => Promise<z.input<TSchema>>
	buildFile: string | ((file: { name: string; path: string }) => string)
	watch?: boolean
	recursive?: boolean
	watchDir: string
	acceptedFileTypes?: `.${string}`[]
}) {
	const codeGen = async ({ filename }: { filename?: string } = {}) => {
		const files = filename ? [filename] : await readdir(watchDir, { recursive })

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
		const context = parseResult.data as z.infer<TSchema>

		if (typeof buildFile === 'string') {
			const code = template.templateFunction(context)
			await Bun.write(buildFile, code)
			console.log(`Generated code at ${buildFile}`)
		} else {
			await Promise.all(
				filtered.map(async file => {
					const outPath = buildFile({ name: file.name, path: file.path })
					const code = template.templateFunction(context, { path: file.path })
					await Bun.write(outPath, code)
					console.log(`Generated code at ${outPath}`)
				})
			)
		}
	}

	await codeGen()

	if (watch) {
		fsWatch(watchDir, { recursive }, async (eventType, filename) => {
			if (!filename) return
			if (!acceptedFileTypes.some(type => filename.endsWith(type))) return

			console.log(`${eventType} in file "${filename}"`)
			await codeGen({ filename })
		})
	}
}
