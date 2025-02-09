// -------------
// Solid Imports
// -------------
import {
	batch,
	each,
	eff_on,
	h,
	mem,
	mounted,
	produce,
	render,
	sig,
	store,
} from "/lib/solid/monke.js";

import { Keymanager } from "/lib/keymanager.js";

// -------------
// Codemirror Imports
// -------------
import {
	basicSetup,
	EditorState,
	EditorView,
	javascript,
	keymap,
	Vim,
	vim,
} from "/lib/codemirror/bundled.js";

// -------------
// UTILITIES
// -------------
let CURRENT_PATH = sig("");
const save_path = "base_editor.json";
const m = () => document.querySelector("iframe")?.contentDocument.M;
const uid = () => Math.random().toString(36).substring(7);

function defer(fn) {
	setTimeout(fn, 10);
}

function eval_code(code) {
	return eval(`"use strict";(${code})`);
}

// =============
// CORE
// =============
class RendererList {
	constructor() {
		const [renderers, set_renderers] = store({});
		this.renderers = renderers;
		this.set_renderers = set_renderers;
	}

	register(type, fn) {
		this.set_renderers(type, fn);
	}

	/**
	 * @param {name} string
	 * @returns {() => View}
	 */
	find(type) {
		const fn_str = this.renderers[type];
		const fn = eval_code(fn_str);
		if (typeof fn == "function") return fn;
		else throw new Error("invalid renderer");
	}
}

class State {
	constructor({ type, blocks, parent, cursor, id }) {
		const _blocks = blocks ? blocks : [];
		const _type = type ? type : "default";
		const _id = id ? id : uid();

		const [model, update] = store({
			blocks: _blocks,
			output: "",
		});

		this.id = _id;
		this.type = _type;
		this.model = model;
		this.update = (...args) => update(...args);

		this.parent = parent;
		this.cursor = sig(cursor || -1);
	}

	get blocks() {
		return this.model.blocks;
	}

	update_blocks(...args) {
		return this.update("blocks", ...args);
	}

	len() {
		return this.model.blocks.length;
	}

	next() {
		this.len() > this.cursor() + 1
			? this.cursor.set(this.cursor() + 1)
			: this.cursor.set(0);
	}

	prev() {
		this.cursor() > 0
			? this.cursor.set(this.cursor() - 1)
			: this.cursor.set(this.len() - 1);
	}

	write() {
		const queue = this.model.blocks.map((comp) => comp.write);
		const run = (code, index) =>
			"function" == typeof code
				? this.update_blocks(index, produce((el) => code(el)))
				: null;

		batch(() => queue.forEach(run));
		this.output = this.model.blocks.map((e) => e.output).join("\n");
	}

	// TODO Localstorage and reload?
	load(path) {
		fetch("/fs/" + path).then((res) => res.json())
			.then((res) => {
				res.blocks
					? this.update("blocks", res.blocks)
					: console.log("no blocks");
				CURRENT_PATH.set(path);
			});
	}

	overwrite(path) {
		console.log("overwriting", path);

		const body = {
			content: JSON.stringify(this.model, null, 2),
		};

		fetch("/fs/" + path, {
			headers: { "Content-Type": "application/json" },
			method: "PUT",
			body: JSON.stringify(body),
		});
	}

	create_new(path) {
		const body = {
			content: JSON.stringify(this.model, null, 2),
		};
		fetch("/fs/" + path, {
			headers: { "Content-Type": "application/json" },
			method: "POST",
			body: JSON.stringify(body),
		});
	}

	save(path) {
		fetch("/exists/" + path).then((res) => res.json()).then((res) =>
			res.exists ? this.overwrite(path) : this.create_new(path)
		);
	}

	preview(path) {
		this.output_file(path);
		window.location = "/fs/" + path;
	}

	output_file(path) {
		const body = {
			content: iframe(),
		};

		fetch("/fs/" + path, {
			headers: { "Content-Type": "application/json" },
			method: "PUT",
			body: JSON.stringify(body),
		});
	}
}

class Editor {
	constructor({ state, components, renderer }) {
		if (!renderer) throw Error("Need a renderer");
		this.renderer = renderer;
		this.state = state ? state : new State({ type: "RootGroup" });
		this.renderers = components ? components : new RendererList();
	}

	register(type, fn_str) {
		this.renderers.register(type, fn_str);
	}

	bind(element, setter) {
		const render = this.renderer;
		const component = render(element, this.state);

		setter((el) => {
			Object
				.entries(component)
				.forEach(([key, value]) => el[key] = value);
		});

		return component.render;
	}

	render() {
		const setter = (fn) => this.state.update(produce(fn));
		return this.bind(this.state, setter);
	}
}

class Positioner {
	constructor(x, y, w, h, unit = "v", position = "fixed") {
		this.x = sig(x || 0);
		this.y = sig(y || 0);
		this.w = sig(w || 0);
		this.h = sig(h || 0);

		this.unit = unit;
		this.position = position;

		this.style = mem(() => {
			const v = this.unit == "v" ? "vh" : this.unit;
			const h = this.unit == "v" ? "vw" : this.unit;

			return `
				position: ${this.position};
				top: ${this.y() + v};
				left: ${this.x() + h};
				height: ${this.h() + v};
				width: ${this.w() + h};
			`;
		});
	}

	get css() {
		return this.style;
	}
}

function state_utils(state) {
	const find_focused = () => state.blocks.find((e) => e.focus);
	const set_current_active = () => {
		if (!state.blocks[state.cursor()]) return;
		state.update_blocks(state.cursor(), "active", true);
		state.update_blocks((_, i) => i != state.cursor(), "active", false);
	};

	const set_current_focus = () => {
		if (!state.blocks[state.cursor()]) return;
		const current = state.blocks[state.cursor()];
		state.update_blocks(state.cursor(), "focus", true);
		if (current.onfocus) current.onfocus();
	};

	const unfocus_current = () => {
		const current = find_focused(state);
		state.update_blocks((e) => e.focus, "focus", false);
		if (current.onunfocus) current.onunfocus();
	};
	return {
		find_focused,
		set_current_active,
		set_current_focus,
		unfocus_current,
	};
}

// =============
// Root Renderer
// =============
/**
 * @param {State} state
 */
function RootRenderer(el, state) {
	const blocks = el.blocks || [];
	state = state || new State({ blocks });

	// add these to state as prototype?
	const {
		set_current_focus,
		set_current_active,
		find_focused,
		unfocus_current,
	} = state_utils(state);

	eff_on(state.cursor, set_current_active);

	const child_style = (child) => {
		const border_is = mem(() => child.active && !child.focus);
		const shadow_is = mem(() => child.focus);

		const border = mem(() => border_is() ? "border: 1px solid grey" : "");
		const box_shadow = mem(() =>
			shadow_is() ? "box-shadow: 0 0 25px 5px rgba(0,0,0,.1)" : ""
		);

		return mem(() => [border(), box_shadow()].join(";"));
	};

	const bind = (child, index) => {
		if (!child) return;
		const item = editor.renderers.find(child.type);
		if (!(typeof item == "function")) return;

		const setter = (...args) => state.update_blocks(index(), ...args);
		const controller = { set_self: setter };
		const component = item(child, index, controller);

		setter(produce((block) => {
			Object
				.entries(component)
				.forEach(([key, value]) => block[key] = value);
		}));

		const style = child_style(child);
		return h("div", { style: style }, component.render);
	};

	const keys = new Keymanager();

	keys.on("Escape", unfocus_current);
	keys.on("Enter", set_current_focus);
	keys.on("shift+c", (_) => add_widget({ type: "code" }));
	keys.on("shift+a", (_) => add_widget({ type: "basic" }));
	keys.on("cmd+m", (_) => state.save(save_path));
	keys.on("cmd+l", (_) => state.load(save_path));
	keys.on("cmd+o", (_) => state.output_file("output.html"));
	keys.on("cmd+e", (_) => state.preview("output.html"));
	keys.on("cmd+b", (_) => console.log("source", CURRENT_PATH));
	keys.on("ctrl+s", (_) => state.write());
	keys.on("j", (_) => state.next());
	keys.on("k", (_) => state.prev());

	const handle_keys = (e) => {
		const focused = find_focused();

		if (focused && e.key != "Escape") {
			if (focused.onkeydown) focused.onkeydown(e);
			console.log("returning");
			return;
		}

		keys.event(e);
	};

	const write = (el) => {
		state.write();
		let output = state.blocks.map((child) => child.output).join("\n");
		state.blocks.forEach((child) => console.log(child));
		el.output = output;
		el.blocks = state.blocks;
	};

	const add_widget = (opts) =>
		state.update_blocks(produce((e) => e.push(opts)));

	return {
		render: () => h("div.group", () => each(() => state.blocks, bind)),
		onkeydown: handle_keys,
		write: (el) => write(el),
	};
}

const editor = new Editor({ renderer: RootRenderer });

/**
 * @typedef {Object} View
 *
 * @property {(el) => void} write
 * @property {() => any[] | any} render
 *
 * @property {() => void} [onkeydown]
 * @property {() => void} [onfocus]
 * @property {() => void} [onunfocus]
 */
window.onload = () => {
	window.addEventListener("keydown", (e) => {
		if (editor.state.model.onkeydown) {
			editor.state.model.onkeydown(e);
		}
	});
};

eff_on(
	() => editor.state.blocks,
	() => console.log(editor.state.blocks.map((e) => e.output).join("\n")),
);

const f = "/";
const iframe = mem(() =>
	`<script type="module"> import {mut} from "/lib/solid/monke.js";
			const M = mut({});
			const SOURCE_PATH = "${CURRENT_PATH()}"
			document.M = M;
			${editor.state.blocks.map((e) => e.output).join("\n")}
		<${f}script>
`
);

const Root = () => {
	const iframe_pos = new Positioner(50, 0, 50, 100);
	const editor_pos = new Positioner(0, 0, 50, 100);

	const iframe_style = iframe_pos.css;
	const editor_style = mem(() => "overflow-y: scroll;" + editor_pos.css());

	return h("div", [
		h("div.editor", { style: editor_style }, editor.render()),
		h("iframe.iframe", { srcdoc: iframe, style: iframe_style }),
	]);
};

// ------------------------
// BASIC ELEMENT
// ------------------------
const basic = (el) => {
	const name = el.name || "unnamed";
	return ({ render: () => h("p", "basic ", name) });
};
editor.register("basic", basic.toString());

// ------------------------
// CODEMIRROR ELEMENT
// ------------------------
function code_element(state) {
	const code = mem(() => state?.output ? state?.output : "");
	const id = uid();
	let save, focus;

	Vim.defineEx("write", "w", () => {
		editor.state.write();
	});
	const render = () => {
		{
			mounted(() => {
				const editor = make_code_mirror(code(), id);
				focus = () => {
					console.log("called");
					setTimeout(() => editor.focus(), 100);
				};

				save = function (el) {
					const text = cm_flatten_tree(editor.state.doc).join("\n");
					console.log("text", text);
					el.focused = editor.hasFocus;
					el.output = text;
					el.cursor = editor.state.selection.ranges[0].from;
				};

				defer(function () {
					if (state.cursor && state.focused) {
						const selection = { anchor: state.cursor, head: state.cursor };
						editor.focus();
						editor.dispatch({ selection });
					}
				});
			});

			return h("div", { class: "editor-" + id });
		}
	};

	return ({
		render: render,
		onfocus: () => focus(),
		write: (...args) => save(...args),
	});
}
editor.register("code", code_element.toString());

// ------------------------
// CODEMIRROR UTILS
// ------------------------
function make_code_mirror(source, id) {
	const element = document.querySelector(".editor-" + id);
	const state = {
		doc: source,
		extensions: [
			vim(),
			basicSetup,
			javascript(),

			keymap.of([
				{
					key: "Escape",
					run: () => {
						editor.contentDOM.blur();
						window.getSelection()?.removeAllRanges();
					},
				},
			]),
		],
	};

	const editor = new EditorView({
		parent: element,
		state: EditorState.create(state),
	});

	return editor;
}

const cm_flatten_tree = (doc) => {
	let text = [];

	if (doc.children) {
		doc.children.forEach((child) => {
			text = text.concat(cm_flatten_tree(child));
		});
	} else if (doc.text) return doc.text;

	return text;
};

render(Root, document.body);
