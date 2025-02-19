import path from "path"
import ffmpeg from "./index.js"
import fs from "fs"

export async function create_frames(input, output_dir) {
	console.log("input", input, 'output', output_dir + `/frame_%03d.jpg`)
	const command = ffmpeg(input)

	// check if exists
	if (!fs.existsSync(output_dir)) {
		throw Error("doesnt exists", output_dir)
	}

	command
		.videoFilter("fps=1/60")
		.output(`${output_dir}/frame_%03d.jpg`)
		.on("progress", (p) => console.log(p))
		.run()
}

export async function crop({ input, output, x, y, w, h }) {
	const command = ffmpeg(input)

	command
		.videoFilter([
			{
				filter: "crop",
				options: `${w}:${h}:${x}:${y}`
			}
		])
		.output(output)
		.on("progress", (p) => console.log(p))
		.run()

}

