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
} from "./codemirror/bundled.js";

// -------------
// UTILITIES
// -------------
const m = () => document.querySelector("iframe")?.contentDocument.M;
const uid = () => Math.random().toString(36).substring(7);

function defer(fn) {
	setTimeout(fn, 10);
}

function eval_code(code) {
	return eval(`"use strict";(${code})`);
}

// -------------
// CORE
// -------------
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
		this.cursor = sig(cursor || 0);
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

function RootRenderer(el, state) {
	const blocks = el.blocks || [];
	state = state || new State({ blocks });

	const set_active = (e, i) => {
		if (i == state.cursor()) e.active = true;
		else e.active = false;
	};

	const oncursor = () => {
		state.update_blocks(produce((el) => el.forEach(set_active)));
	};

	eff_on(state.cursor, oncursor);

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

		const style = mem(() => `
				border: ${child.active && !child.focus ? "1px solid grey" : null};
				box-shadow: ${child.focus ? "0 0 25px 5px rgba(0,0,0,.1)" : null};
		`);

		return h("div", { style: style }, component.render);
	};

	const set_current_focus = () => {
		const current = state.model.blocks[state.cursor()];
		state.update_blocks(state.cursor(), "focus", true);

		if (current.onfocus) current.onfocus();
	};

	const find_focused = () => state.model.blocks.find((e) => e.focused);

	const unfocus_current = () => {
		state.update_blocks((e) => e.focused, focused, "false");
		if (current.onfocus) current.onunfocus();
	};

	const keys = new Keymanager();

	keys.on("Escape", unfocus_current);
	keys.on("Enter", set_current_focus);
	keys.on("shift+c", (_) => add_widget({ type: "code" }));
	keys.on("shift+a", (_) => add_widget({ type: "basic" }));
	keys.on("ctrl+s", (_) => state.write());
	keys.on("j", (_) => state.next());
	keys.on("k", (_) => state.prev());

	const handle_keys = (e) => {
		const focused = find_focused();
		if (focused && focused.onkeydown) {
			focused.onkeydown(e);
			return;
		}

		keys.event(e);
	};

	const write = (el) => {
		state.write();
		let output = state.model.blocks.map((child) => child.output).join("\n");
		state.model.blocks.forEach((child) => console.log(child));
		el.output = output;
		el.blocks = state.model.blocks;
	};

	const add_widget = (opts) =>
		state.update_blocks(produce((e) => e.push(opts)));

	return {
		render: () => h("div.group", () => each(() => state.model.blocks, bind)),
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
const basic = (el) => {
	const name = el.name || "unnamed";
	return ({ render: () => h("p", "basic ", name) });
};

window.onload = () => {
	window.addEventListener("keydown", (e) => {
		if (editor.state.model.onkeydown) {
			editor.state.model.onkeydown(e);
		}
	});
};

eff_on(
	() => editor.state.model.blocks,
	() => console.log(editor.state.model.blocks.map((e) => e.output).join("\n")),
);

const iframe = mem(() => `
	<script type="module">
		import {mut} from "/lib/solid/monke.js"
		let M = mut({})
		document.M = M
		${editor.state.model.blocks.map((e) => e.output).join("\n")}
	</script>
`);

const Root = () => {
	return h("div", [
		h("div.editor", editor.render()),
		h("iframe.iframe", { srcdoc: iframe }),
	]);
};

// ------------------------
// CODEMIRROR ELEMENT
// ------------------------
const cm_flatten_tree = (doc) => {
	let text = [];

	if (doc.children) {
		doc.children.forEach((child) => {
			text = text.concat(cm_flatten_tree(child));
		});
	} else if (doc.text) return doc.text;

	return text;
};

function code_element(state) {
	const code = mem(() => state?.output ? state?.output : "");
	const id = uid();
	let save, focus;

	const render = () => {
		{
			mounted(() => {
				const editor = make_code_mirror(code(), id);
				focus = () => {
					console.log("called");
					setTimeout(() => editor.focus(), 100);
				};

				save = function(el) {
					const text = cm_flatten_tree(editor.state.doc).join("\n");
					console.log("text", text);
					el.focused = editor.hasFocus;
					el.output = text;
					el.cursor = editor.state.selection.ranges[0].from;
				};

				defer(function() {
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

Vim.defineEx("write", "w", () => {
	editor.state.write();
});

const register = (t, f) => editor.register(t, f);

register("basic", basic.toString());
register("code", code_element.toString());

render(Root, document.body);
