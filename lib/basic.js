import {
	each,
	eff_on,
	h,
	html,
	mem,
	mut,
	produce,
	render,
	sig,
	store,
} from "/lib/solid/monke.js";

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

function bind(element, setter) {
	if (!element) return;

	const control = {
		set_self: (...args) => setter(...args),
	};

	console.log(element.type);

	const render = renderers.find(element.type);
	const component = render(element, () => 0, control);

	setter((el) => {
		Object
			.entries(component)
			.forEach(([key, value]) => el[key] = value);
	});

	return component.render;
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
	 * @returns {() => ViewController}
	 */
	find(type) {
		const fn_str = this.renderers[type];
		const fn = eval_code(fn_str);
		if (typeof fn == "function") return fn;
		else throw new Error("invalid renderer");
	}
}

class State {
	parent;
	id;
	blocks;
	cursor;
	type;

	// hold the model...
	// trigger writes
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
		this.update = (...args) => {
			update(...args);
		};

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

		console.log("from here", this.cursor());
	}

	prev() {
		this.cursor() > 0
			? this.cursor.set(this.cursor() - 1)
			: this.cursor.set(this.len() - 1);

		console.log("from here", this.cursor());
	}

	write() { }
}

const state = new State({ type: "RootGroup" });
const renderers = new RendererList();

/**
 * @typedef {Object} ViewController
 *
 * @property {(el) => void} write
 * @property {() => any[] | any} render
 *
 * @property {() => void} [onkeydown]
 * @property {() => void} [onfocus]
 * @property {() => void} [onunfocus]
 */

const basic = (el, i, c) => {
	let name = el.name || "unnamed";
	return ({
		render: () => h("p", "who", name),
	});
};

const RootGroup = (el, i, c) => {
	const blocks = el.blocks || [];
	const state = new State({ blocks });

	const set_active = (e, i) => {
		if (i == state.cursor()) {
			e.active = true;
		} else {
			e.active = false;
		}
	};

	const oncursor = () => {
		state.update_blocks(produce((el) => el.forEach(set_active)));
	};

	eff_on(state.cursor, oncursor);

	const bind = (child, index) => {
		if (!child) return;
		const item = renderers.find(child.type);
		if (!(typeof item == "function")) return;

		const setter = (...args) => state.update_blocks(index(), ...args);
		const controller = { set_self: setter };

		const component = item(child, i, controller);

		Object
			.entries(component)
			.forEach(([key, value]) => setter(key, value));

		const style = mem(() => `
				border: ${child.active && !child.focus ? "1px solid grey" : null};
				box-shadow: ${child.focus ? "0 0 25px 5px rgba(0,0,0,.1)" : null};
		`);
		return h("div", { style: style }, component.render);
	};

	const set_current_focus = () =>
		state.update_blocks(state.cursor(), "focus", true);

	const keymanager = (e) => {
		switch (e.key) {
			case "Enter":
				set_current_focus();
				break;

			case "A":
				add_widget({ type: "basic" });
				break;

			case "E":
				add_widget({ type: "basic", name: "your mom" });
				break;

			case "j":
				state.next();
				break;

			case "k":
				state.prev();
				break;
		}
	};

	const add_widget = (opts) =>
		state.update_blocks(produce((e) => e.push(opts)));

	return {
		render: () => h("div", () => each(() => state.model.blocks, bind)),
		onkeydown: keymanager,
	};
};

renderers.register("basic", basic.toString());
renderers.register("RootGroup", RootGroup.toString());

window.onload = () => {
	window.addEventListener("keydown", (e) => {
		if (state.model.onkeydown) {
			state.model.onkeydown(e);
		}
	});
};

const iframe = mem(() => `
	<h1>hello in iframe</h1>
	<script type="module">
		import {mut} from "/lib/solid/monke.js"
		let M = mut({})
		document.M = M
	</script>
`);

const Root = () => {
	const setter = (fn) => state.update(produce(fn));
	return h("div", [
		h("div.editor", bind(state, setter)),
		h("iframe.iframe", { srcdoc: iframe }),
	]);
};

render(Root, document.body);

// ------------------------
// CODEMIRROR ELEMENT
// ------------------------
// const cm_flatten_tree = (doc) => {
// 	let text = [];
//
// 	if (doc.children) {
// 		doc.children.forEach((child) => {
// 			text = text.concat(cm_flatten_tree(child));
// 		});
// 	} else if (doc.text) return doc.text;
//
// 	return text;
// };
//
//
// function code_element(state) {
// 	let code = mem(() => state?.output ? state?.output : "");
// 	let uid = Math.random().toString(36).substring(7);
// 	let save, focus;
//
// 	return ({
// 		render: () => {
// 			mounted(() => {
// 				let editor = make_code_mirror(code(), uid);
// 				focus = () => setTimeout(() => editor.focus(), 100);
//
// 				save = function (el) {
// 					el.focused = editor.hasFocus;
// 					let text = cm_flatten_tree(editor.state.doc).join("\n");
// 					el.output = text;
// 					el.cursor = editor.state.selection.ranges[0].from;
// 				};
//
// 				defer(function () {
// 					if (state.cursor && state.focused) {
// 						const selection = { anchor: state.cursor, head: state.cursor };
// 						editor.focus();
// 						editor.dispatch({ selection });
// 					}
// 				});
// 			});
// 			return html`div [ class = ${"editor-" + uid} ]`;
// 		},
// 		onfocus: () => focus(),
// 		write: (...args) => save(...args),
// 	});
// }
//
// function make_code_mirror(source, id) {
// 	Vim.defineEx("write", "w", (_) => {
// 		trigger_save();
// 	});
//
// 	let editor = new EditorView({
// 		parent: document.querySelector(".editor-" + id),
// 		state: EditorState.create({
// 			doc: source,
// 			extensions: [
// 				basicSetup,
// 				javascript(),
//
// 				keymap.of([
// 					{
// 						key: "Escape",
// 						run: () => {
// 							editor.contentDOM.blur();
// 							window.getSelection()?.removeAllRanges();
// 						},
// 					},
// 				]),
// 			],
// 		}),
// 	});
//
// 	return editor;
// }
