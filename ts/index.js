import path from "path"
import fs from "fs"

import {
	createSystem,
	createVirtualTypeScriptEnvironment,
} from "@typescript/vfs"

import ts from "typescript"


let len = 0

const read_file = async (file_path) => {
	console.log("path", file_path)
	let root = process.cwd()
	let full_path = path.join(root, file_path)
	console.log("path", full_path)
	const is_file = fs.lstatSync(full_path).isFile()
	if (is_file) {
		return fs.readFileSync(full_path, { encoding: "utf8" })
	}
	else {
		return false
	}
}


const addUserLibraries = async (map) => {
	const getLib = async (name) => {
		const lib = "/lib/"
		console.log("trying", lib + name)
		let r = await read_file(lib + name)
		if (r) {
			return r
		} else {
			return false
		}
	}
	//
	const addLib = async (name, map) => {
		console.log("adding library: ", name)
		let val = await getLib(name)
		console.log("map_setting:", "/lib/" + name)
		if (val) map.set("/lib/" + name, val)
		else console.log("Failed")
	}

	// read /lib/ dir
	// for each file add it
	//
	let root = process.cwd()
	let full_path = path.join(root, "/lib/")
	const files = await fs.promises.readdir(full_path, { recursive: true });
	const is_d_ts = (filename) => {
		let split = filename.split(".")
		let ts = split.pop()
		let d = split.pop()

		return (ts == "ts" && d == "d")
	}
	files.forEach((file) => {
		if (file.includes("node_modules")) return
		if (file.split(".").pop() == "js"
			|| is_d_ts(file)
		) {
			console.log("going to file", file)
			addLib(file, map)
		}
	})
}

const createDefaultMap2015 = async () => {

	const getLib = async (name) => {
		const lib = "/ts/typescript/"
		let r = await read_file(lib + name)
		len += r.length
		return r
	}
	//
	const addLib = async (name, map) => {
		map.set("/" + name, await getLib(name))
	}

	const fsMap = new Map()

	let libs = [
		"lib.d.ts",
		"lib.decorators.d.ts",
		"lib.decorators.legacy.d.ts",
		"lib.dom.asynciterable.d.ts",
		"lib.dom.d.ts",
		"lib.dom.iterable.d.ts",
		"lib.es5.d.ts",
		"lib.es6.d.ts",
		"lib.es2015.collection.d.ts",
		"lib.es2015.core.d.ts",
		"lib.es2015.d.ts",
		"lib.es2015.generator.d.ts",
		"lib.es2015.iterable.d.ts",
		"lib.es2015.promise.d.ts",
		"lib.es2015.proxy.d.ts",
		"lib.es2015.reflect.d.ts",
		"lib.es2015.symbol.d.ts",
		"lib.es2015.symbol.wellknown.d.ts",
		"lib.es2016.array.include.d.ts",
		"lib.es2016.d.ts",
		"lib.es2016.full.d.ts",
		"lib.es2016.intl.d.ts",
		"lib.es2017.arraybuffer.d.ts",
		"lib.es2017.d.ts",
		"lib.es2017.date.d.ts",
		"lib.es2017.full.d.ts",
		"lib.es2017.intl.d.ts",
		"lib.es2017.object.d.ts",
		"lib.es2017.sharedmemory.d.ts",
		"lib.es2017.string.d.ts",
		"lib.es2017.typedarrays.d.ts",
		"lib.es2018.asyncgenerator.d.ts",
		"lib.es2018.asynciterable.d.ts",
		"lib.es2018.d.ts",
		"lib.es2018.full.d.ts",
		"lib.es2018.intl.d.ts",
		"lib.es2018.promise.d.ts",
		"lib.es2018.regexp.d.ts",
		"lib.es2019.array.d.ts",
		"lib.es2019.d.ts",
		"lib.es2019.full.d.ts",
		"lib.es2019.intl.d.ts",
		"lib.es2019.object.d.ts",
		"lib.es2019.string.d.ts",
		"lib.es2019.symbol.d.ts",
	]

	for await (const lib of libs) {
		await addLib(lib, fsMap)
	}

	return fsMap
}



export async function create_env(content) {
	let fsMap = await createDefaultMap2015()
	const system = createSystem(fsMap)
	addUserLibraries(fsMap)
	fsMap.set("index.js", content)

	const compilerOpts = { target: ts.ScriptTarget.ES2017, esModuleInterop: true, allowJs: true, checkJs: true }
	const env = createVirtualTypeScriptEnvironment(system, ["index.js"], ts, compilerOpts)
	return env
}

export const extra = {
	displayPartsToString: ts.displayPartsToString
}
