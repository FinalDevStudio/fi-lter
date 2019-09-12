const regesc = require('escape-string-regexp');
const diregex = require('fi-di-regex');

/**
 * Splits a text into keywords.
 *
 * @param {String} text The input text.
 *
 * @returns {String[]} The selected keywords array.
 */
function split (text) {
  const selected = [];
  const parts = (text || '').replace(/\s+?/gi, ' ')
    .split(/\s/gi);

  parts.forEach((part) => {
    const trimmed = part.trim();

    if (trimmed.length > 1) {
      selected.push(trimmed);
    }
  });

  return selected;
}

/**
 * Escapes and add diacritic insensitiveness.
 *
 * @param {String} str The string to escape and diacritic insensitivize.
 *
 * @returns {String} The filtered string.
 */
function filter (str) {
  const escaped = regesc(str || '').toLowerCase();
  return diregex.build(escaped || '', {
    string: true,
  });
}

const REGEX_OPTS = 'gi';
const PIPE = '|';

/**
 * Matches exact results.
 *
 * @param {String[]} keywords The keywords list to match.
 *
 * @returns {RegExp} The regular expression.
 */
function exact (keywords) {
  return new RegExp(split(keywords).map(w => `(?=.*\\b${filter(w)})`)
    .join(''), REGEX_OPTS);
}

/**
 * Matches mixed results.
 *
 * @param {RegExp} keywords The regular expression to use.
 *
 * @returns {RegExp} The regular expression.
 */
function mixed (keywords) {
  return new RegExp(split(keywords).map(w => filter(w))
    .join(PIPE), REGEX_OPTS);
}

/**
 * Matches fuzzy results.
 *
 * @param {RegExp} keywords The regular expression to use.
 *
 * @returns {RegExp} The regular expression.
 */
function fuzzy (keywords) {
  const unique = [];

  split(keywords).join('').split('').forEach((w) => {
    const f = filter(w);

    if (unique.indexOf(f) < 0) {
      unique.push(f);
    }
  });

  return new RegExp(unique.map(w => `(?=.*${w})`).join(''), REGEX_OPTS);
}

module.exports = {

  exact,

  mixed,

  fuzzy,

};
