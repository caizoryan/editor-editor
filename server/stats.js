import process from "process"
import path from "path"

let lib = path.resolve("./lib")
let fs = path.resolve("./fs")

export const GET = (req, res) => {
	res.json({
		cwd: process.cwd(),
		lib,
		fs,
	})
}
