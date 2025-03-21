import { PluginKey } from '../../../prosemirror-state/dist/index.js';

const pluginKey = new PluginKey('autocomplete');
function inSuggestion(selection, decorations) {
    return decorations.find(selection.from, selection.to).length > 0;
}

export { inSuggestion, pluginKey };
