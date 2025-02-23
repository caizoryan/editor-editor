
import path from "path";
import fs from "fs";
import { crop } from "../lib/sharp/sharp.js";

let directory = path.resolve("./fs")

export function POST(req, res) {
	console.log("POST REQ")
	let p = req.path.replace("/sharp/", "")
	p = path.join(directory, p)

	let body = req.body
	console.log("body", body)
	let input = path.resolve("." + body.input)
	let output = path.resolve("." + body.output)
	let action = body.action
	let args = body.args
	console.log("input", input)

	// check if input exists
	if (fs.existsSync(input)) {

		// run action
		if (action == "crop") {
			const { x, y, w, h } = args
			let opts = { left: x, top: y, width: w, height: h }
			crop(input, output, opts)
		}

	} else console.log("inputy no exists")
}

