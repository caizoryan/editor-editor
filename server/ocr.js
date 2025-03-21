// import { detect } from "../lib/_ocr/main.js"
// import path from "path"
// import fs from "fs"
//
// let req = "/fs/"
// let media = path.resolve("." + req)
//
// export const GET = async (req, res) => {
// 	console.log("got req")
// 	let p = req.path.replace("/ocr/", "")
// 	p = path.join(media, p)
//
// 	if (!fs.existsSync(p)) {
// 		res.status(404).json({ error: "file no exist" })
// 		return
// 	} else {
// 		// check p for ext .jpg, .png, or jpeg
// 		let allowed = ["jpg", "png", "jpeg"]
// 		let ext = p.split(".").pop()
// 		if (allowed.includes(ext)) detect(p).then((r) => res.json(r))
// 		else res.status(500).json({ error: "dissallowed filetype of type: " + ext })
// 	}
//
// }
