import {
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

function defer(fn) {
	setTimeout(fn, 10);
}

function eval_code(code) {
	return eval(`"use strict";(${code})`);
}

function bind(element, setter) {
	if (!element) return;

	const render = renderers.find(element.type);
	const control = {
		set_self: (...args) => setter(...args),
	};

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
	constructor({ type, blocks, parent, cursor }) {
		const _blocks = blocks ? blocks : [];
		const _type = type ? type : "default";

		const [model, update] = store({
			blocks: _blocks,
			output: "",
		});

		this.type = _type;
		this.model = model;
		this.update = update;
		this.parent = parent;
		this.cursor = sig(cursor);
	}

	len() {
		return model.blocks.length;
	}

	next() {
		this.len() > this.cursor() + 1
			? this.cursor.set(cursor() + 1)
			: this.cursor.set(0);
	}

	prev() {
		this.cursor() > 0
			? this.cursor.set(this.cursor() - 1)
			: this.cursor.set(this.len() - 1);
	}

	write() {}
}

const state = new State({ type: "basic" });
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
	return ({
		render: () => html`p -- hello`,
	});
};

renderers.register("basic", basic.toString());

const iframe = mem(() => `
	<h1>hello in iframe</h1>
	<script type="module">
		import {mut} from "/lib/solid/monke.js"
		let M = mut({})
		document.M = M
	</script>
`);

const Root = () => {
	let setter = (fn) => state.update(produce(fn));
	return html`
			.editor -- ${bind(state, setter)}
			iframe.iframe [srcdoc=${iframe}] 
		`;
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
