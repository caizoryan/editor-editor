import {
	ts,
	createSystem,
	createVirtualTypeScriptEnvironment,
} from "./tsserver.js"

let len = 0

const read_file = async (path) => {
	// check if file is a file
	console.log("reading", path)
	return fetch(path).then((res) => res.text())
}

const getLib = async (name) => {
	const lib = "/lib/ts/typescript/"
	let r = await read_file(lib + name)
	console.log("read", name)
	len += r.length
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

async function init() {
	let fsMap = await createDefaultMap2015()
	console.log("made map")
	console.log("total len", len)
	const system = createSystem(fsMap)
	console.log("made system")

	const content = `
		console.log("mean")
		let r = 0
		let f = nine

		console.
`

	fsMap.set("index.ts", content)

	const compilerOpts = { target: ts.ScriptTarget.ES2015, esModuleInterop: true }
	const env = createVirtualTypeScriptEnvironment(system, ["index.ts"], ts, compilerOpts)
	console.log("made virtual env")


	// You can then interact with the languageService to introspect the code
	let log = env.languageService.getSyntacticDiagnostics("index.ts")

	console.log(log)

}

init()
