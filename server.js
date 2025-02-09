import fs from "fs";
import cors from "cors";
import express from "express";
import path from "path";
import process from "process";
import bodyParser from "body-parser";

// **********************************
// ----------------------------------
// TYPES
// ----------------------------------
// **********************************
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

// **********************************
// ----------------------------------
// CONFIG
// ----------------------------------
// **********************************
//
const CONFIG = {
	DIR: "/fs/",
	LIB: "/lib/",
};
//

// **********************************
// ----------------------------------
// OVERWRITE FILE
// ----------------------------------
// **********************************
function overwrite_path(req, res) {
	const file_path = req.path.replace("/fs", "");
	const full_path = path.join(process.cwd(), CONFIG.DIR, file_path);
	const body = req.body;
	console.log("overwriting", file_path);
	console.log("body", body);

	if (!body) return res.status(400).send("No body provided");

	has_extension(file_path) ? write_file(full_path, body) : write_dir(full_path);
}

// **********************************
// ----------------------------------
// WRITE (NEW) FILE
// ----------------------------------
// **********************************
function write_path(req, res) {
	// const options = { root: path.join(process.cwd()) };

	const file_path = req.path.replace("/fs", "");
	const full_path = path.join(process.cwd(), CONFIG.DIR, file_path);
	const body = req.body;

	if (!body) return res.status(400).send("No body provided");

	// Will check if file exists and create it if not
	// If file exists, will return error
	if (fs.existsSync(CONFIG.DIR + full_path)) {
		return res.status(400).send("File already exists");
	}

	has_extension(file_path) ? write_file(full_path, body) : write_dir(full_path);
}

function write_file(path, body) {
	fs.writeFileSync(path, JSON.stringify(body, null, 2));
}

function write_dir(path) {
	fs.mkdirSync(path, { recursive: true });
}

// **********************************
// ----------------------------------
// GET
// ----------------------------------
// **********************************

/**
 * Will check path provided at files/[*path*]
 * against current directory. And can go two ways:
 *
 * 1. Directory: If there is no extension, will see if there
 *    is a directory, and return an Object with
 *    {
 *  	   type: dir,
 *  	   files: string[]
 *    }
 *
 * 2. File: If there is an extension, will check if there is a
 *    file with the name, if there is, it will return the file.
 */
const get_path_base = (root) => (req, res) => {
	const options = { root: path.join(process.cwd()) };
	const file_path = req.path.replace(root, "");
	console.log("file_path", file_path);

	const file_res = has_extension(file_path)
		? get_file(file_path, root)
		: get_directory(file_path);

	if (!file_res) return res.status(404).send("File not found");
	if (file_res.type == "file") res.sendFile(file_res.path, options);
	else if (file_res.type === "dir") res.json(file_res);
};

const get_exists_base = (root) => (req, res) => {
	const file_path = req.path.replace("/exists/", "");
	console.log("exists called ->", file_path);

	const file_res = has_extension(file_path)
		? get_file(file_path, root)
		: get_directory(file_path);

	const result = {
		exists: file_res ? true : false,
	};

	res.json(result);
};

const get_path = get_path_base(CONFIG.DIR);
const get_library = get_path_base(CONFIG.LIB);
const get_exists = get_exists_base(CONFIG.DIR);
//
//
/** ---------------------------------
 * @param {string} path
 * @returns {File}
 * ---------------------------------- */
function get_file(path, root) {
	console.log("path", path);
	console.log("root", root);
	if (!fs.existsSync("." + root + path)) return null;
	return { type: "file", path: "." + root + path };
}

/** ---------------------------------
 * @param {string} path
 * @returns {Dir}
 * ---------------------------------- */
function get_directory(path) {
	if (!fs.existsSync("." + CONFIG.DIR + path)) return null;
	const files = fs.readdirSync("." + CONFIG.DIR + path);
	return { type: "dir", files };
}

function has_extension(str) {
	return str.split("/").pop().includes(".");
}

// **********************************
// ----------------------------------
// INIT SERVER
// ----------------------------------
// **********************************

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
	res.sendFile("index.html", { root: path.join(process.cwd()) });
});
app.get("/exists/*", get_exists);
app.get("/fs/*", get_path);
app.get("/lib/*", get_library);

app.post("/fs/*", write_path);
app.put("/fs/*", overwrite_path);

const port = 8888;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
