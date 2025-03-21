import { inputRules } from '../../../prosemirror-inputrules/dist/index.js';
import { ActionKind } from './types.js';
import { getDecorationPlugin } from './decoration.js';
import { createInputRule } from './inputRules.js';

function defaultReducer(options) {
    return (action) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        switch (action.kind) {
            case ActionKind.open:
                return (_b = (_a = options.onOpen) === null || _a === void 0 ? void 0 : _a.call(options, action)) !== null && _b !== void 0 ? _b : false;
            case ActionKind.close:
                return (_d = (_c = options.onClose) === null || _c === void 0 ? void 0 : _c.call(options, action)) !== null && _d !== void 0 ? _d : false;
            case ActionKind.up:
            case ActionKind.down:
            case ActionKind.left:
            case ActionKind.right:
                return (_f = (_e = options.onArrow) === null || _e === void 0 ? void 0 : _e.call(options, action)) !== null && _f !== void 0 ? _f : false;
            case ActionKind.filter:
                return (_h = (_g = options.onFilter) === null || _g === void 0 ? void 0 : _g.call(options, action)) !== null && _h !== void 0 ? _h : false;
            case ActionKind.enter:
                return (_k = (_j = options.onEnter) === null || _j === void 0 ? void 0 : _j.call(options, action)) !== null && _k !== void 0 ? _k : false;
            default:
                return false;
        }
    };
}
function autocomplete(opts = {}) {
    const options = Object.assign({ triggers: [], reducer: defaultReducer(opts) }, opts);
    const { reducer, triggers } = options;
    const plugin = getDecorationPlugin(reducer);
    const rules = [
        plugin,
        inputRules({
            // Create an input rule for each trigger
            rules: triggers.map((type) => createInputRule(plugin, type)),
        }),
    ];
    return rules;
}

export { autocomplete, defaultReducer };
