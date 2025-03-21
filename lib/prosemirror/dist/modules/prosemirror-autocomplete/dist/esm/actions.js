import { pluginKey } from './utils.js';

function openAutocomplete(view, trigger, filter) {
    // TODO: Can activate a type?
    const plugin = pluginKey.get(view.state);
    const meta = { action: 'add', trigger, filter, type: null };
    const tr = view.state.tr
        .insertText(`${trigger}${filter !== null && filter !== void 0 ? filter : ''}`)
        .scrollIntoView()
        .setMeta(plugin, meta);
    view.dispatch(tr);
}
function closeAutocomplete(view) {
    const plugin = pluginKey.get(view.state);
    const meta = { action: 'remove' };
    const tr = view.state.tr.setMeta(plugin, meta);
    view.dispatch(tr);
    return true;
}

export { closeAutocomplete, openAutocomplete };
