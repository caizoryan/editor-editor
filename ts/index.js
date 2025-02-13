import path from "path"
import fs from "fs"

import {
	createSystem,
	createVirtualTypeScriptEnvironment,
} from "@typescript/vfs"

import ts from "typescript"

let len = 0

const read_file = async (file_path) => {
	let root = process.cwd()
	let full_path = path.join(root, file_path)
	console.log("path", full_path)
	let read = fs.readFileSync(full_path, { encoding: "utf8" })
	return read
}

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

const createDefaultMap2015 = async () => {
	const fsMap = new Map()
	await addLib("lib.es2015.d.ts", fsMap)
	await addLib("lib.es2015.collection.d.ts", fsMap)
	await addLib("lib.es2015.core.d.ts", fsMap)
	await addLib("lib.es2015.generator.d.ts", fsMap)
	await addLib("lib.es2015.iterable.d.ts", fsMap)
	await addLib("lib.es2015.promise.d.ts", fsMap)
	await addLib("lib.es2015.proxy.d.ts", fsMap)
	await addLib("lib.es2015.reflect.d.ts", fsMap)
	await addLib("lib.es2015.symbol.d.ts", fsMap)
	await addLib("lib.es2015.symbol.wellknown.d.ts", fsMap)
	await addLib("lib.dom.d.ts", fsMap)
	await addLib("lib.es5.d.ts", fsMap)
	await addLib("lib.es6.d.ts", fsMap)

	return fsMap
}

export async function create_env(content) {
	let fsMap = await createDefaultMap2015()
	const system = createSystem(fsMap)

	fsMap.set("index.js", content)

	const compilerOpts = { target: ts.ScriptTarget.ES2015, esModuleInterop: true, allowJs: true, checkJs: true }
	const env = createVirtualTypeScriptEnvironment(system, ["index.js"], ts, compilerOpts)
	return env
}

