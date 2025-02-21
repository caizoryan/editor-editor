import { create_frames, crop, crop_relative } from "../lib/ffmpeg/utils.js"

import path from "path"
import fs from "fs"

let req = "/fs/"
let media = path.resolve("." + req)

export const GET = async (req, res) => {
	console.log("GET?")
	// let p = req.path.replace("/ffmpeg/", "")
	// p = path.join(media, p)
	//
	// // res.json({ path: p })
	// if (!fs.existsSync(p)) {
	// 	res.status(404).json({ error: "file no exist" })
	// 	return
	// } else {
	// 	// check p for ext .jpg, .png, or jpeg
	// 	let allowed = ["mp4"]
	// 	let ext = p.split(".").pop()
	// 	if (allowed.includes(ext)) create_frames(p, path.resolve("./fs/media/testing")).then((r) => res.json({ worked: path.resolve("./fs/media/testing") }))
	// 	else res.status(500).json({ error: "dissallowed filetype of type: " + ext })
	// }
}

export const POST = async (req, res) => {
	// TODO: Change shape to liek tsserver /action -> body{args} : generate lib fn for these to use in fn
	console.log("POST REQ")
	let p = req.path.replace("/ffmpeg/", "")
	p = path.join(media, p)

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
			const { x, y, w, h, videoWidth, videoHeight } = args
			let opts = { input, output, x, y, w, h, videoWidth, videoHeight }
			console.log(opts)
			crop_relative(opts)
		}

		if (action == "frames") {
			const { fps } = args
			if (!fps) console.log("no fps")
			let opts = { fps }
			console.log(opts)
			create_frames(input, output, fps)
		}

	} else console.log("inputy no exists")
}

