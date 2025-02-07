let special_keys = {
	"esc": 27,
	"escape": 27,
	"tab": 9,
	"space": 32,
	"return": 13,
	"enter": 13,
	"backspace": 8,

	"scrolllock": 145,
	"scroll_lock": 145,
	"scroll": 145,
	"capslock": 20,
	"caps_lock": 20,
	"caps": 20,
	"numlock": 144,
	"num_lock": 144,
	"num": 144,

	"pause": 19,
	"break": 19,

	"insert": 45,
	"home": 36,
	"delete": 46,
	"end": 35,

	"pageup": 33,
	"page_up": 33,
	"pu": 33,

	"pagedown": 34,
	"page_down": 34,
	"pd": 34,

	"left": 37,
	"up": 38,
	"right": 39,
	"down": 40,

	"f1": 112,
	"f2": 113,
	"f3": 114,
	"f4": 115,
	"f5": 116,
	"f6": 117,
	"f7": 118,
	"f8": 119,
	"f9": 120,
	"f10": 121,
	"f11": 122,
	"f12": 123,
};
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

	toString() {
		return JSON.stringify({
			ctrl: this.ctrl,
			meta: this.meta,
			alt: this.alt,
			char: this.char,
		});
	}
}

function parseKey(keystroke) {
	let keystroke_obj = {
		shift: false,
		ctrl: false,
		alt: false,
		meta: false, //Meta is Mac specific
		char: "",
	};

	let keys = keystroke.toLowerCase().split("+");

	for (let i = 0; i < keys.length; i++) {
		let k = keys[i];
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
	}

	return keystroke_obj;
}

export const test = () => {
	let keystroke_str = "shift+cmd+b";
	let key_obj = {
		shift: true,
		ctrl: false,
		alt: false,
		meta: true,
		char: "b",
	};

	let key_1 = parseKey(keystroke_str);
	let key_2 = new Keystroke(key_obj);

	console.log(key_1, key_1.toString());
	console.log(key_2, key_2.toString());

	if (key_2.compare(key_1)) {
		console.log("IT WORKS FFFF");
	}
};

export class Keymanager {
	constructor() {}

	add(keystroke, callback, opts) {
		// -------------------
		// managing options
		// -------------------
		let default_options = {
			"type": "keydown",
			"propagate": false,
			"disable_in_input": false,
			"keycode": false,
		};

		this.options = opts || default_options;

		for (const dfo in default_options) {
			if (typeof this.options[dfo] == "undefined") {
				this.options[dfo] = default_options[dfo];
			}
		}

		// -------------------
		// parsing keystroke
		// -------------------
		keystroke = keystroke.toLowercase();

		const check_key = (e) => {
			// -------------------
			// disable Input and Textarea
			// -------------------
			if (opt["disable_in_input"]) {
				let element;
				if (e.target) element = e.target;
				else if (e.srcElement) element = e.srcElement;
				if (element.nodeType == 3) element = element.parentNode;

				if (element.tagName == "INPUT" || element.tagName == "TEXTAREA") return;
			}

			// -------------------
			// Find Which key is pressed
			// -------------------
			if (e.keyCode) code = e.keyCode;
			else if (e.which) code = e.which;
			let character = String.fromCharCode(code).toLowerCase();

			if (code == 188) character = ","; //If the user presses , when the type is onkeydown
			if (code == 190) character = "."; //If the user presses , when the type is onkeydown
		};
	}
}
