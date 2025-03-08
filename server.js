import fs from "fs";
import cors from "cors";
import express from "express";
import path from "path";
import process from "process";
import bodyParser from "body-parser";
import { create_env, extra } from "./ts/index.js";


// **********************************
// ----------------------------------
// TYPES
// ----------------------------------
// **********************************
/**
 * @typedef {Object} Dir
 * @property {'dir'} type
 * @property {string[]} files
 * @property {string[]} dirs
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
//


// **********************************
// ----------------------------------
// TSSERVER
// ----------------------------------
// **********************************
let env
create_env("console.log(null)").then((e) => {
	env = e

	e.languageService.getNavigationTree
})

function get_tsserver(req, res) {
	const fn = req.path.replace("/ts", "").replace("/", "");
	if (!env) return []
	if (env.languageService[fn]) res.json(env.languageService[fn]("index.js"))
}

function post_tsserver(req, res) {
	const fn = req.path.replace("/ts", "").replace("/", "");

	if (!env) return []
	if (env.languageService[fn]) res.json(env.languageService[fn]("index.js", ...req.body.args))
	else if (extra[fn]) res.json(extra[fn](...req.body.args))
}

function tsserver(message, req, res) {
	if (message == "semantic_diagnostics") semantic_diagnositcs(res)
	else if (message == "syntactic_diagnostics") syntactic_diagnositcs(res)
	else if (message == "completion_at") res.json(completion_at(req.body.pos))
}

function semantic_diagnositcs(res) {
	if (!env) return []
	let d = env.languageService.getSemanticDiagnostics("index.js")

	if (Array.isArray(d)) {
		d = d.map((m) => ({
			start: m.start,
			length: m.length,
			messageText: m.messageText,
			code: m.code,
			category: m.category,
		}))
	}

	return res.json({ content: d })
}

function syntactic_diagnositcs(res) {
	if (!env) return []
	let d = env.languageService.getSyntacticDiagnostics("index.js")
	if (Array.isArray(d)) {
		d = d.map((m) => ({
			start: m.start,
			length: m.length,
			messageText: m.messageText,
			code: m.code,
			category: m.category,
		}))
	}

	res.json({ content: d })
}

function completion_at(pos) {
	console.log("pos: ", pos)

	if (env) return env.languageService.getCompletionsAtPosition('index.js', pos)
	else return []
}


function tsserver_update(req, res) {
	const body = req.body

	const content = body.content;

	if (env) env.updateFile("index.js", content)
	res.status(200).send()
}

// **********************************
// ----------------------------------
// OVERWRITE FILE
// ----------------------------------
// **********************************
function overwrite_path(req, res) {
	const file_path = req.path.replace("/fs", "");
	const full_path = path.join(process.cwd(), CONFIG.DIR, file_path);
	const body = req.body;
	const content = body.content;

	console.log("overwriting", file_path);
	console.log("content", content);

	if (!body) return res.status(400).send("No body provided");

	has_extension(file_path)
		? write_file(full_path, content)
		: write_dir(full_path);

	res.status(200).send()
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
	const content = body.content;

	// TODO will not make dir... fix this
	if (!body) return res.status(400).send("No body provided");

	// Will check if file exists and create it if not
	// If file exists, will return error
	if (fs.existsSync(CONFIG.DIR + full_path)) {
		return res.status(400).send("File already exists");
	}

	has_extension(file_path)
		? write_file(full_path, content)
		: write_dir(full_path);
}

function write_file(path, body) {
	let b = `${body}`;
	fs.writeFileSync(path, b, { encoding: "utf8" });
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
	const file_path = req.path
	console.log("file_path", file_path);

	const file_res = has_extension(file_path)
		? get_file(file_path)
		: get_directory(file_path);

	if (!file_res) return res.status(404).send("File not found");
	if (file_res.type == "file") res.status(200).sendFile(file_res.path, options);
	else if (file_res.type === "dir") res.status(200).json(file_res);
};

const get_exists_base = (root) => (req, res) => {
	const file_path = req.path.replace("/exists/", "/fs/");
	console.log("exists called ->", file_path);

	const file_res = has_extension(file_path)
		? get_file(file_path)
		: get_directory(file_path);

	const result = {
		exists: file_res ? true : false,
	};

	res.json(result);
};

const get_path_transformed_js = (req, res) => {
	console.log("path ->", req.path)
	const options = { root: path.join(process.cwd()) };
	const file_path = req.path.replace("/js/", "/fs/");
	console.log("file_path ->", file_path);
	if (!has_extension(file_path)) res.status(404).send("Invalid File, dir not allowed")

	let file = get_file(file_path)
	if (file?.type == "file") {
		if (file.path.split(".").pop() == "json") {
			let str = fs.readFileSync(path.join(options.root, file.path), { encoding: "utf8" })
			let json = JSON.parse(str)
			let out
			if (json.blocks && json.blocks.length > 0) out = json.blocks.map((e) => e.output).join("")
			if (out) {
				console.log("sending", file_path)
				res.set('Content-Type', 'text/javascript');
				res.send(Buffer.from(out));
			}

		}
	}

	if (!file) return res.status(404).send("File not found");
}

const get_path_transformed = (req, res) => {
	console.log("path ->", req.path)
	const options = { root: path.join(process.cwd()) };
	const file_path = req.path.replace("/fs-run/", "/fs/");
	console.log("file_path ->", file_path);
	if (!has_extension(file_path)) res.status(404).send("Invalid File, dir not allowed")

	let file = get_file(file_path)
	if (file?.type == "file") {
		if (file.path.split(".").pop() == "json") {
			let str = fs.readFileSync(path.join(options.root, file.path), { encoding: "utf8" })
			let json = JSON.parse(str)
			let out
			if (json.blocks && json.blocks.length > 0) out = json.blocks.map((e) => e.output).join("")
			if (out) {
				out = '<script type="module">' + out + '</script>'
				console.log("sending", file_path)
				res.set('Content-Type', 'text/html');
				res.send(Buffer.from(out));
			}

		}
	}

	if (!file) return res.status(404).send("File not found");
}


const get_path = get_path_base(CONFIG.DIR);
const get_dirs = (req, res) => res.json(get_directory(""))
const get_library = get_path_base(CONFIG.LIB);
const get_exists = get_exists_base(CONFIG.DIR);
//
//
/** ---------------------------------
 * @param {string} path
 * @returns {File}
 * ---------------------------------- */
function get_file(path) {
	console.log("get file from -> path", path);
	if (!fs.existsSync("." + path)) return null;
	return { type: "file", path: "." + path };
}


/** ---------------------------------
 * @param {string} file_name
 * @returns {boolean}
 * ---------------------------------- */
const is_file = (file_name) => {
	return fs.lstatSync(file_name).isFile();
};

/** ---------------------------------
 * @param {string} _path
 * @returns {Dir}
 * ---------------------------------- */
function get_directory(_path) {
	const full_path = path.join(".", _path)
	if (!fs.existsSync(full_path)) return null;

	const files = fs.readdirSync(full_path).filter((p) => is_file(path.join(full_path, p)))
	const dirs = fs.readdirSync(full_path).filter((p) => !is_file(path.join(full_path, p)))
	return { type: "dir", files, dirs };
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
app.use(bodyParser.json({ limit: '50mb' }));

app.get("/", (req, res) => {
	res.sendFile("index.html", { root: path.join(process.cwd()) });
});
app.get("/exists/*", get_exists);
app.get("/fs/*", get_path);
app.get("/fs-run/*", get_path_transformed);
app.get("/js/*", get_path_transformed_js);
// app.get("/f", get_dirs);
app.get("/lib/*", get_library);

app.get("/tsserver/semantic_diagnostics", (res, req) => tsserver("semantic_diagnostics", res, req))
app.get("/tsserver/syntactic_diagnostics", (res, req) => tsserver("syntactic_diagnostics", res, req))
app.get("/ts/*", get_tsserver)
app.post("/ts/*", post_tsserver)

app.post("/tsserver/update", tsserver_update)
app.post("/tsserver/completion_at", (res, req) => tsserver("completion_at", res, req))

app.post("/fs/*", write_path);
app.put("/fs/*", overwrite_path);

let endpoints = fs.readdirSync(path.join("./server/")).filter(p => p.split(".").pop() == "js")
console.log("ENDPOINTS", endpoints)

endpoints.forEach(async (end) => {
	let points = await import(path.join(path.resolve("./server/"), end));
	let replaced = end.replace(".js", "")

	if (points.GET) app.get("/" + replaced + "/*", points.GET)
	if (points.POST) app.post("/" + replaced + "/*", points.POST)
	// if (points.PUT) app.put("/" + replaced + "/*", points.PUT)
})


const port = 8888;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
