import process from "process"
import path from "path"

let lib = path.resolve("./lib")
let fs = path.resolve("./fs")
let req = "/fs/"
let media = path.resolve("." + req)

export const GET = (req, res) => {
	let p = req.path.replace("/another/", "")
	res.json({
		cwd: process.cwd(),
		lib,
		fs,
		media: path.join(media, p)
	})
}
