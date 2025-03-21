import { undoInputRule } from '../../../prosemirror-inputrules/dist/index.js';
import { Plugin } from '../../../prosemirror-state/dist/index.js';
import { DecorationSet, Decoration } from '../../../prosemirror-view/dist/index.js';
import { closeAutocomplete } from './actions.js';
import { ActionKind, KEEP_OPEN } from './types.js';
import { pluginKey, inSuggestion } from './utils.js';

const inactiveAutocompleteState = {
    active: false,
    decorations: DecorationSet.empty,
};
function actionFromEvent(event) {
    switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
            return event.key;
        case 'Tab':
        case 'Enter':
            return ActionKind.enter;
        case 'Escape':
            return ActionKind.close;
        default:
            return null;
    }
}
function cancelIfInsideAndPass(view) {
    const plugin = pluginKey.get(view.state);
    const { decorations } = plugin.getState(view.state);
    if (inSuggestion(view.state.selection, decorations)) {
        closeAutocomplete(view);
    }
    return false;
}
function getDecorationPlugin(reducer) {
    const plugin = new Plugin({
        key: pluginKey,
        view() {
            return {
                update: (view, prevState) => {
                    var _a, _b, _c, _d;
                    const prev = plugin.getState(prevState);
                    const next = plugin.getState(view.state);
                    const started = !prev.active && next.active;
                    const stopped = prev.active && !next.active;
                    const changed = next.active && !started && !stopped && prev.filter !== next.filter;
                    const action = {
                        view,
                        trigger: (_a = next.trigger) !== null && _a !== void 0 ? _a : prev.trigger,
                        filter: (_b = next.filter) !== null && _b !== void 0 ? _b : prev.filter,
                        range: (_c = next.range) !== null && _c !== void 0 ? _c : prev.range,
                        type: (_d = next.type) !== null && _d !== void 0 ? _d : prev.type,
                    };
                    if (started)
                        reducer(Object.assign(Object.assign({}, action), { kind: ActionKind.open }));
                    if (changed)
                        reducer(Object.assign(Object.assign({}, action), { kind: ActionKind.filter }));
                    if (stopped)
                        reducer(Object.assign(Object.assign({}, action), { kind: ActionKind.close }));
                },
            };
        },
        state: {
            init: () => inactiveAutocompleteState,
            apply(tr, state) {
                var _a, _b, _c;
                const meta = tr.getMeta(plugin);
                if ((meta === null || meta === void 0 ? void 0 : meta.action) === 'add') {
                    const { trigger, filter, type } = meta;
                    const from = tr.selection.from - trigger.length - ((_a = filter === null || filter === void 0 ? void 0 : filter.length) !== null && _a !== void 0 ? _a : 0);
                    const to = tr.selection.from;
                    const className = ((_b = type === null || type === void 0 ? void 0 : type.decorationAttrs) === null || _b === void 0 ? void 0 : _b.class)
                        ? ['autocomplete', (_c = type === null || type === void 0 ? void 0 : type.decorationAttrs) === null || _c === void 0 ? void 0 : _c.class].join(' ')
                        : 'autocomplete';
                    const attrs = Object.assign(Object.assign({}, type === null || type === void 0 ? void 0 : type.decorationAttrs), { class: className });
                    const deco = Decoration.inline(from, to, attrs, {
                        inclusiveStart: false,
                        inclusiveEnd: true,
                    });
                    return {
                        active: true,
                        trigger: meta.trigger,
                        decorations: DecorationSet.create(tr.doc, [deco]),
                        filter: filter !== null && filter !== void 0 ? filter : '',
                        range: { from, to },
                        type,
                    };
                }
                const { decorations } = state;
                const nextDecorations = decorations.map(tr.mapping, tr.doc);
                const hasDecoration = nextDecorations.find().length > 0;
                // If no decoration, explicitly remove, or click somewhere else in the editor
                if ((meta === null || meta === void 0 ? void 0 : meta.action) === 'remove' ||
                    !inSuggestion(tr.selection, nextDecorations) ||
                    !hasDecoration)
                    return inactiveAutocompleteState;
                const { active, trigger, type } = state;
                // Ensure that the trigger is in the decoration
                const { from, to } = nextDecorations.find()[0];
                const text = tr.doc.textBetween(from, to);
                if (!text.startsWith(trigger))
                    return inactiveAutocompleteState;
                return {
                    active,
                    trigger,
                    decorations: nextDecorations,
                    filter: text.slice(trigger.length),
                    range: { from, to },
                    type,
                };
            },
        },
        props: {
            decorations: (state) => { var _a; return (_a = plugin.getState(state)) === null || _a === void 0 ? void 0 : _a.decorations; },
            handlePaste: (view) => cancelIfInsideAndPass(view),
            handleDrop: (view) => cancelIfInsideAndPass(view),
            handleKeyDown(view, event) {
                var _a, _b;
                const { trigger, active, decorations, type } = plugin.getState(view.state);
                if (!active || !inSuggestion(view.state.selection, decorations))
                    return false;
                const { from, to } = decorations.find()[0];
                const text = view.state.doc.textBetween(from, to);
                // Be defensive, just in case the trigger doesn't exist
                const filter = text.slice((_a = trigger === null || trigger === void 0 ? void 0 : trigger.length) !== null && _a !== void 0 ? _a : 1);
                const checkCancelOnSpace = (_b = type === null || type === void 0 ? void 0 : type.cancelOnFirstSpace) !== null && _b !== void 0 ? _b : true;
                if (checkCancelOnSpace &&
                    filter.length === 0 &&
                    (event.key === ' ' || event.key === 'Spacebar')) {
                    closeAutocomplete(view);
                    // Take over the space creation so no other input rules are fired
                    view.dispatch(view.state.tr.insertText(' ').scrollIntoView());
                    return true;
                }
                if (filter.length === 0 && event.key === 'Backspace') {
                    undoInputRule(view.state, view.dispatch);
                    closeAutocomplete(view);
                    return true;
                }
                const kind = actionFromEvent(event);
                const action = {
                    view,
                    trigger,
                    filter,
                    range: { from, to },
                    type,
                    event,
                };
                switch (kind) {
                    case ActionKind.close:
                        // The user action will be handled in the view code above
                        // Allows clicking off to be handled in the same way
                        return closeAutocomplete(view);
                    case ActionKind.enter: {
                        // Only trigger the cancel if it is not expliticly handled in the select
                        const result = reducer(Object.assign(Object.assign({}, action), { kind: ActionKind.enter }));
                        if (result === KEEP_OPEN)
                            return true;
                        return result || closeAutocomplete(view);
                    }
                    case ActionKind.up:
                    case ActionKind.down:
                        return Boolean(reducer(Object.assign(Object.assign({}, action), { kind })));
                    case ActionKind.left:
                    case ActionKind.right:
                        if (!(type === null || type === void 0 ? void 0 : type.allArrowKeys))
                            return false;
                        return Boolean(reducer(Object.assign(Object.assign({}, action), { kind })));
                }
                return false;
            },
        },
    });
    return plugin;
}

export { getDecorationPlugin };
