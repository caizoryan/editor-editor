import Ocr from '@gutenye/ocr-node'

export async function detect(path) {
	const ocr = await Ocr.create()
	const result = await ocr.detect(path)
	return result
}

