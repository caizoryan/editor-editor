import fs from "fs";
import cors from "cors"
import express from "express";
import path from "path";
import process from "process";

const app = express();

app.use(cors())

// /files/*
// will check if file exists. If no extenstion, check if directory exists and return directory listing
//

app.get('/files/*', (req, res) => {
	console.log("cwd", process.cwd());

	const options = {
		root: path.join(process.cwd()),
	};


	let path_ = req.path.replace('/files', '')
	let file = get_file(path_);

	if (!file) return res.status(404).send('File not found')

	if (file.type === 'file') res.sendFile(file.path, options)
	else if (file.type === 'dir') res.json(file)

	else res.status(404).send('File not found')
})

let port = 8888
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
})

/**
 * @typedef {Object} File
 *
 * /

/**
 * @param {string} path
 * @returns {}
*/
function get_file(path) {
	console.log("title", path);
	console.log("path", './files/' + path);

	if (!fs.existsSync('./files/' + path)) return null
	if (!has_extension(path)) {
		console.log("is dir");
		let files = fs.readdirSync('./files/' + path);
		return {
			type: 'dir',
			files
		};
	}

	return {
		type: 'file',
		path: '/files/' + path
	}
}

function has_extension(str) {
	return str.split('/').pop().includes('.');
}
