import fs from "fs";
import cors from "cors";
import express from "express";
import path from "path";
import process from "process";

const app = express();

app.use(cors());

// **********************************
// ----------------------------------
// WRITE FILE
// ----------------------------------
// **********************************
app.post("/files/*", (req, res) => {
	const options = { root: path.join(process.cwd()) };

	let file_path = req.path.replace("/files", "");
	let body = req.body;

	if (!body) return res.status(400).send("No body provided");

	// Will check if file exists and create it if not
	// If file exists, will return error

	if (fs.existsSync("./files/" + file_path)) {
		return res.status(400).send("File already exists");
	}
});

// **********************************
// ----------------------------------
// GET FILE
// ----------------------------------
// **********************************

app.get("/files/*", (req, res) => {
	const options = { root: path.join(process.cwd()) };

	let file_path = req.path.replace("/files", "");
	let file = get_file(file_path);

	if (!file) return res.status(404).send("File not found");

	if (file.type == "file") res.sendFile(file.path, options);
	else if (file.type === "dir") res.json(file);
});

/**
 * @typedef {Object} Dir
 * @property {'dir'} type
 * @property {string[]} files
 *
 * @typedef {Object} File
 * @property {'file'} type
 * @property {string} path
 *
 * @typedef {(Dir | File)} FileResponse
 */

/**
 * @param {string} path
 * @returns {FileResponse}
 */
function get_file(path) {
	console.log("title", path);
	console.log("path", "./files/" + path);

	if (!fs.existsSync("./files/" + path)) return null;
	if (!has_extension(path)) {
		console.log("is a directory");
		let files = fs.readdirSync("./files/" + path);
		return { type: "dir", files };
	}

	return { type: "file", path: "/files/" + path };
}

function has_extension(str) {
	return str.split("/").pop().includes(".");
}

// **********************************
// ----------------------------------
// INIT SERVER
// ----------------------------------
// **********************************

let port = 8888;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
