import path from "path"
import ffmpeg from "./index.js"
import fs from "fs"

export async function create_frames(input, output_dir, fps) {
	console.log("input", input, 'output', output_dir + `/frame_%03d.jpg`)
	const command = ffmpeg(input)

	// check if exists
	if (!fs.existsSync(output_dir)) {
		throw Error("doesnt exists", output_dir)
	}

	ffmpeg.ffprobe(input, function(err, metadata) {
		let video = metadata.streams.find((stream) => stream.codec_type == "video")

		console.log("width", video.width);
		console.log("height", video.height);

		command
			.videoFilter("fps=" + fps)
			.videoFilter("scale=" + video.width + ":" + video.height)
			.output(`${output_dir}/%03d.jpg`)
			.on("progress", (p) => console.log(p))
			.run()
	});

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

export async function crop_relative({ input, output, x, y, w, h, videoWidth, videoHeight }) {
	// const command = ffmpeg(input)

	ffmpeg.ffprobe(input, function(err, metadata) {
		let video = metadata.streams.find((stream) => stream.codec_type == "video")

		console.log("width", video.width);
		console.log("height", video.height);

		let percentage_w = video.width / videoWidth
		let corrected_w = w * percentage_w
		let corrected_x = x * percentage_w

		let percentage_h = video.height / videoHeight
		let corrected_h = h * percentage_h
		let corrected_y = y * percentage_h

		// calculate relative x, y, w, h by getting 
		// a multiplier from video.widht / videoWidth and || for height
		crop({ input, output, x: corrected_x, y: corrected_y, w: corrected_w, h: corrected_h })
	});

	// command
	// 	.videoFilter([
	// 		{
	// 			filter: "crop",
	// 			options: `${w}:${h}:${x}:${y}`
	// 		}
	// 	])
	// 	.output(output)
	// 	.on("progress", (p) => console.log(p))
	// 	.run()
}

