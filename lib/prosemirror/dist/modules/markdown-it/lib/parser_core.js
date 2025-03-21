import Ruler from './ruler.js';
import StateCore from './rules_core/state_core.js';
import normalize from './rules_core/normalize.js';
import block from './rules_core/block.js';
import inline from './rules_core/inline.js';
import linkify from './rules_core/linkify.js';
import replace from './rules_core/replacements.js';
import smartquotes from './rules_core/smartquotes.js';
import text_join from './rules_core/text_join.js';

/** internal
 * class Core
 *
 * Top-level rules executor. Glues block/inline parsers and does intermediate
 * transformations.
 **/


const _rules = [
  ['normalize',      normalize],
  ['block',          block],
  ['inline',         inline],
  ['linkify',        linkify],
  ['replacements',   replace],
  ['smartquotes',    smartquotes],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ['text_join',      text_join]
];

/**
 * new Core()
 **/
function Core () {
  /**
   * Core#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of core rules.
   **/
  this.ruler = new Ruler();

  for (let i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
}

/**
 * Core.process(state)
 *
 * Executes core chain rules.
 **/
Core.prototype.process = function (state) {
  const rules = this.ruler.getRules('');

  for (let i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};

Core.prototype.State = StateCore;

export { Core as default };
