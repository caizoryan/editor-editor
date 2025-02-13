import {
	ts,
	createSystem,
	createVirtualTypeScriptEnvironment,
} from "./tsserver.js"


const read_file = async (path) => {
	return fetch(path).then((res) => res.text())
}

const getLib = async (name) => {
	const lib = "/lib/ts/typescript/"
	let r = await read_file(lib + name)
	console.log("read", r)
	return r
}
//
const addLib = async (name, map) => {
	map.set("/" + name, await getLib(name))
}

const createDefaultMap2015 = async () => {
	const fsMap = new Map()
	let all = [
		addLib("lib.es2015.d.ts", fsMap),
		addLib("lib.es2015.collection.d.ts", fsMap),
		addLib("lib.es2015.core.d.ts", fsMap),
		addLib("lib.es2015.generator.d.ts", fsMap),
		addLib("lib.es2015.iterable.d.ts", fsMap),
		addLib("lib.es2015.promise.d.ts", fsMap),
		addLib("lib.es2015.proxy.d.ts", fsMap),
		addLib("lib.es2015.reflect.d.ts", fsMap),
		addLib("lib.es2015.symbol.d.ts", fsMap),
		addLib("lib.es2015.symbol.wellknown.d.ts", fsMap),
		addLib("lib.dom.d.ts", fsMap),
		addLib("lib.es5.d.ts", fsMap),
		addLib("lib.es6.d.ts", fsMap),
	]

	await Promise.allSettled(all)

	console.log("returning")
	return fsMap
}

export async function createEnvironment(content) {
	let fsMap = await createDefaultMap2015()
	fsMap.set("index.js", content)

	const system = createSystem(fsMap)

	const compilerOpts = { target: ts.ScriptTarget.ES2015, esModuleInterop: true, allowJs: true }
	const env = createVirtualTypeScriptEnvironment(system, ["index.js"], ts, compilerOpts)
	return env
}

