import sharp from "sharp"

export function crop(input, output, { top, left, width, height }) {
	top = parseInt(top)
	left = parseInt(left)
	width = parseInt(width)
	height = parseInt(height)

	sharp(input)
		.extract({ left, top, width, height })
		.toFile(output);
}


// for (let i = 1; i < 10; i++) {
// 	let num = `00${i}`
//
// 	let p_1 = path.join(media_dir, `/scrolls/gaming/${num}.jpg`)
//
// 	let crops = fs.readFileSync(path.join(media_dir, `/scrolls/gaming/${num}.json`), { encoding: "utf8" })
//
// 	let boxes = JSON.parse(crops)
// 	boxes.forEach((el, i) => {
// 		let box = el.box
// 		let o_1 = path.join(media_dir, `/scrolls/gaming/${num}_cropped_${i}.jpg`)
//
// 		let xs = box.map(([x, y]) => x)
// 		let ys = box.map(([x, y]) => y)
//
// 		let padding = 10
//
// 		let left = Math.abs(Math.min(...xs) - padding)
// 		let top = Math.abs(Math.min(...ys) - padding)
//
// 		let width = Math.max(...xs) - left + padding
// 		let height = Math.max(...ys) - top + padding
//
// 		sharp(p_1)
// 			.extract({ left, top, width, height })
// 			.toFile(o_1);
// 	})
//
// }


