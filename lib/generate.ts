import { watch as fsWatch } from 'node:fs'
import { readdir } from 'node:fs/promises'
import type { ValidateTemplate, ValueFunction } from './types'

async function codeGen<T extends string, V extends ValueFunction[]>({
	watchDir,
	buildFile,
	template,
	values
}: {
	watchDir: string
	buildFile: string
	template: ValidateTemplate<T, V>
	values: V
}) {
	const files = await readdir(watchDir, { recursive: false })
	const context = { files, watchDir }
	const generatedValues = values.map(fn => fn(context))
	if (typeof template !== 'string') {
		throw template
	}

	const code = template.replace(
		/\$(\d+)/g,
		(_, index) => generatedValues[Number.parseInt(index) - 1] || ''
	)
	await Bun.write(Bun.file(buildFile, {}), code)
}

export async function generate<T extends string, V extends ValueFunction[]>(params: {
	watchDir: string
	buildFile: string
	template: ValidateTemplate<T, V>
	values: V
	watch?: boolean
}) {
	const { watch, watchDir } = params
	await codeGen(params)

	if (watch) {
		fsWatch(watchDir, async () => {
			await codeGen(params)
		})
	}
}
