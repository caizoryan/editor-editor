import Ocr from '@gutenye/ocr-node'

const ocr = await Ocr.create()
const result = await ocr.detect('./output_001.jpg')
result.forEach((e) => console.log(e.text))

