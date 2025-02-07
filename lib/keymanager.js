// let special_keys = {
// 	"esc": 27,
// 	"escape": 27,
// 	"tab": 9,
// 	"space": 32,
// 	"return": 13,
// 	"enter": 13,
// 	"backspace": 8,
//
// 	"scrolllock": 145,
// 	"scroll_lock": 145,
// 	"scroll": 145,
// 	"capslock": 20,
// 	"caps_lock": 20,
// 	"caps": 20,
// 	"numlock": 144,
// 	"num_lock": 144,
// 	"num": 144,
//
// 	"pause": 19,
// 	"break": 19,
//
// 	"insert": 45,
// 	"home": 36,
// 	"delete": 46,
// 	"end": 35,
//
// 	"pageup": 33,
// 	"page_up": 33,
// 	"pu": 33,
//
// 	"pagedown": 34,
// 	"page_down": 34,
// 	"pd": 34,
//
// 	"left": 37,
// 	"up": 38,
// 	"right": 39,
// 	"down": 40,
//
// 	"f1": 112,
// 	"f2": 113,
// 	"f3": 114,
// 	"f4": 115,
// 	"f5": 116,
// 	"f6": 117,
// 	"f7": 118,
// 	"f8": 119,
// 	"f9": 120,
// 	"f10": 121,
// 	"f11": 122,
// 	"f12": 123,
// };
const shift_nums = {
	"`": "~",
	"1": "!",
	"2": "@",
	"3": "#",
	"4": "$",
	"5": "%",
	"6": "^",
	"7": "&",
	"8": "*",
	"9": "(",
	"0": ")",
	"-": "_",
	"=": "+",
	";": ":",
	"'": '"',
	",": "<",
	".": ">",
	"/": "?",
	"\\": "|",
};

export class Keystroke {
	constructor({ shift, ctrl, alt, meta, char }) {
		this.shift = shift || false;
		this.ctrl = ctrl || false;
		this.alt = alt || false;
		this.meta = meta || false;
		this.char = char || "";
	}

	compare({ shift, ctrl, alt, meta, char }) {
		return this.shift == shift &&
			this.ctrl == ctrl &&
			this.alt == alt &&
			this.meta == meta &&
			this.char == char;
	}

	compareModifier({ shift, ctrl, alt, meta }) {
		return this.shift == shift &&
			this.ctrl == ctrl &&
			this.alt == alt &&
			this.meta == meta;
	}

	toString() {
		const ctrl = this.ctrl ? "Ctrl" : "";
		const meta = this.ctrl ? "CMD" : "";
		const shift = this.shift ? "Shift" : "";
		const alt = this.ctrl ? "Alt" : "";
		const char = this.char ? this.char : "";

		return [ctrl, meta, shift, alt, char].filter((e) => e != "").join(" + ");
	}

	compareEvent(e) {
		// -------------------
		// Find Which key is pressed
		// -------------------
		let code;

		if (e.keyCode) code = e.keyCode;
		let character = e.key.toLowerCase();

		if (Object.values(shift_nums).includes(e.key) && e.shiftKey) {
			character = shift_nums[e.key];
		}

		if (code == 188) character = ","; //If the user presses , when the type is onkeydown
		if (code == 190) character = "."; //If the user presses , when the type is onkeydown

		const keystroke_event = {
			shift: false,
			ctrl: false,
			alt: false,
			meta: false,
			char: character,
		};

		if (e.ctrlKey) keystroke_event.ctrl = true;
		if (e.shiftKey) keystroke_event.shift = true;
		if (e.altKey) keystroke_event.alt = true;
		if (e.metaKey) keystroke_event.meta = true;

		const matched = this.compare(keystroke_event);
		return matched;
	}
}

export class Keymanager {
	constructor() {
		this.keystrokes = [];
	}

	event(e) {
		this.keystrokes.forEach((fn) => fn(e));
	}

	parse_key(keystroke) {
		let keystroke_obj = {
			shift: false,
			ctrl: false,
			alt: false,
			meta: false, //Meta is Mac specific
			char: "",
		};

		let keys = keystroke.toLowerCase().split("+");

		keys.forEach((k) => {
			//Modifiers
			if (k == "ctrl" || k == "control") {
				keystroke_obj.ctrl = true;
			} else if (k == "shift") {
				keystroke_obj.shift = true;
			} else if (k == "alt") {
				keystroke_obj.alt = true;
			} else if (k == "meta" || k == "cmd") {
				keystroke_obj.meta = true;
			} else {
				keystroke_obj.char = k;
			}
		});

		return keystroke_obj;
	}

	create_fn(shortcut, callback, options) {
		return function check_key(e) {
			// -------------------
			// disable Input and Textarea
			// -------------------
			if (options["disable_in_input"]) {
				let element;
				if (e.target) element = e.target;
				else if (e.srcElement) element = e.srcElement;
				if (element.nodeType == 3) element = element.parentNode;
				if (element.tagName == "INPUT" || element.tagName == "TEXTAREA") return;
			}

			const matched = shortcut.compareEvent(e);

			// -------------------
			// running callback
			// -------------------
			if (matched) {
				console.log("*️⃣ Matched " + shortcut.toString());
				if (!options["propagate"]) { //Stop the event
					e.stopPropagation();
					e.preventDefault();
				}

				callback();
			}
		};
	}

	add(keystroke, callback, opts) {
		//
		// -------------------
		// managing options
		// -------------------
		const default_options = {
			"type": "keydown",
			"propagate": false,
			"disable_in_input": false,
			"keycode": false,
		};

		const options = default_options;
		if (opts) Object.assign(options, opts);

		const shortcut_str = keystroke.toLowerCase();
		const shortcut_parsed = this.parse_key(shortcut_str);
		const shortcut = new Keystroke(shortcut_parsed);

		const check_key = this.create_fn(shortcut, callback, options);

		this.keystrokes.push(check_key);
	}
}
