const regesc = require('escape-string-regexp');
const diregex = require('fi-di-regex');

class Regexer {
  /**
   * Splits a text into keywords.
   *
   * @param {String} str The input string.
   *
   * @returns {String[]} The selected keywords array.
   */
  static split (str) {
    const selected = [];
    const parts = (str || '').replace(/\s+?/gi, ' ')
      .split(/\s/gi);

    for (const part of parts) {
      const trimmed = part.trim();

      if (trimmed.length > 1) {
        selected.push(trimmed);
      }
    }

    return selected;
  }

  /**
   * Escapes and add diacritic insensitiveness.
   *
   * @param {String} str The string to escape and "diacritic-ly insensitivize".
   *
   * @returns {String} The filtered string.
   */
  static filter (str) {
    const escaped = regesc(str || '').toLowerCase();

    return diregex.build(escaped || '', {
      string: true
    });
  }

  /**
   * Matches exact results.
   *
   * @param {String[]} keywords The keywords list to match.
   * @param {String[]} flags The flags to set. Defaults to `gi`.
   * @param {String[]} regex Whether to return a `RegExp` object. Defaults to `true`.
   *
   * @returns {String|RegExp} The regular expression.
   */
  static exact (keywords, flags = 'gi', regex = true) {
    const expr = this.split(keywords).map(word => `(?=.*\\b${this.filter(word)})`)
      .join('');

    if (regex) {
      return new RegExp(expr, flags);
    }

    return expr;
  }

  /**
   * Matches mixed results.
   *
   * @param {RegExp} keywords The keywords list to match.
   * @param {String[]} flags The flags to set. Defaults to `gi`.
   * @param {String[]} regex Whether to return a `RegExp` object. Defaults to `true`.
   *
   * @returns {String|RegExp} The regular expression.
   */
  static mixed (keywords, flags = 'gi', regex = true) {
    const expr = this.split(keywords).map(word => this.filter(word))
      .join('|');

    if (regex) {
      return new RegExp(expr, flags);
    }

    return expr;
  }

  /**
   * Matches fuzzy results.
   *
   * @param {RegExp} keywords The keywords list to match.
   * @param {String[]} flags The flags to set. Defaults to `gi`.
   * @param {String[]} regex Whether to return a `RegExp` object. Defaults to `true`.
   *
   * @returns {String|RegExp} The regular expression.
   */
  static fuzzy (keywords, flags = 'gi', regex = true) {
    const words = this.split(keywords).join('').split('');
    const unique = [];

    for (const word of words) {
      const filtered = this.filter(word);

      if (unique.indexOf(filtered) < 0) {
        unique.push(filtered);
      }
    }

    const expr = unique.map(word => `(?=.*${word})`).join('');

    if (regex) {
      return new RegExp(expr, flags);
    }

    return expr;
  }
}

module.exports = Regexer;
