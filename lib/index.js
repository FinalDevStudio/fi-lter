/**
 * @module filter
 */

const { ObjectId } = require('mongodb');
const is = require('fi-is');

const regexer = require('./regexer');
const stages = require('./stages');

class FiLter {
  /**
   * Builds a filter by fields aggregation stage by checking whether the params
   * value with the same name is truthy or falsy and filters by not null or null
   * respectively in a $match stage.
   *
   * @param {String[]} fields The fields to filter.
   * @param {Object} params The parameters object.
   *
   * @returns {Object} The aggregation stage object.
   *
   * @throws {Error} If any of the parameters is of wrong type.
   *
   * @example
   * const fields = ['disabledAt', 'createdAt', 'updatedAt'];
   *
   * const params = {
   *   disabledAt: false,
   * };
   *
   * const stage = filter.byFields(fields, params);
   *
   * // Stage will be:
   * {
   *   $match: {
   *     disabledAt: {
   *       $ne: null
   *     }
   *   }
   * }
   */
  static byFields (fields, params) {
    if (is.not.array(fields)) {
      throw new Error('The fields argument must be a String Array.');
    }

    if (is.not.object(params)) {
      throw new Error('The params argument must be an Object.');
    }

    const $match = {};

    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(params, field)) {
        if (params[field] === 'true') {
          $match[field] = {
            $ne: null,
          };
        } else {
          $match[field] = null;
        }
      }
    });

    return {
      $match,
    };
  }

  /**
   * Builds an exclude by _id aggregation stage by adding excluded Object Ids to a
   * $nin inside a $match stage.
   *
   * @param {String[]|ObjectID[]} exclude Excluded ids array.
   *
   * @returns {Object} The aggregation stage object.
   *
   * @throws {Error} If any of the parameters is of wrong type.
   *
   * @example
   * const exclude = [
   *   '59f1d626a787d654433ecff4', '59f1d627a787d654433ecff5',
   *   '59f1d627a787d654433ecff6', '59f1d627a787d654433ecff7',
   * ];
   *
   * const stage = filter.excludeById(exclude);
   *
   * // Stage will be:
   * $match: {
   *   _id: {
   *     $nin: [
   *       ObjectId('59f1d626a787d654433ecff4'),
   *       ObjectId('59f1d627a787d654433ecff5'),
   *       ObjectId('59f1d627a787d654433ecff6'),
   *       ObjectId('59f1d627a787d654433ecff7'),
   *     ]
   *   }
   * }
   */
  static excludeById (exclude) {
    const $nin = [];

    if (is.not.empty(exclude)) {
      let ids;

      if (is.string(exclude)) {
        ids = [exclude];
      } else if (is.array(exclude)) {
        ids = exclude;
      } else {
        throw new Error('The exclude argument must be a String, a String Array or and ObjectID Array.');
      }

      ids.forEach((value) => {
        if (ObjectId.isValid(value)) {
          $nin.push(new ObjectId(value));
        }
      });
    }

    return {
      $match: {
        _id: {
          $nin,
        },
      },
    };
  }

  /**
   * Builds a filter by numeric range $match stage using $and conditions for each
   * field.
   *
   * @param {Object[]} ranges Numeric ranges object.
   * @param {String} ranges.name The range key name in the params object.
   * @param {String} ranges.field The range field name in the model.
   * @param {String} ranges.cond The range query condition ($lte, $gte, $eq).
   * @param {Object} params Request query params object.
   *
   * @returns {Object} The aggregation stage object.
   *
   * @throws {Error} If any of the parameters is of wrong type.
   *
   * @example
   * const ranges = [{
   *   name: 'yearFrom',
   *   field: 'year',
   *   cond: '$gte',
   * }, {
   *   name: 'yearTo',
   *   field: 'year',
   *   cond: '$lte',
   * }];
   *
   * const params = {
   *   yearFrom: 2012,
   *   yearTo: 2017,
   * };
   *
   * const stage = filter.byNumRange(ranges, params);
   *
   * // Stage will be:
   * $match: {
   *   $and: [{
   *     year: {
   *       $gte: 2012
   *     }
   *   }, {
   *     year: {
   *       $lte: 2017
   *     }
   *   }]
   * }
   */
  static byNumRange (ranges, params) {
    if (is.not.array(ranges)) {
      throw new Error('The ranges argument must be an Object Array.');
    }

    if (is.not.object(params)) {
      throw new Error('The params argument must be an Object.');
    }

    const $and = [];

    ranges.forEach((range) => {
      if (Object.prototype.hasOwnProperty.call(params, range.name)) {
        const num = parseFloat(params[range.name], 10);

        if (is.number(num) && num > 0) {
          const cond = {};

          cond[range.field] = {};
          cond[range.field][range.cond] = num;

          $and.push(cond);
        }
      }
    });

    if (is.not.empty($and)) {
      return { $match: { $and } };
    }

    return { $match: {} };
  }

  /**
   * Builds a $group stage, grouping by id, filter slug, filter score and adding
   * the list of props by their $first accumulator.
   *
   * @param {String[]} props The list name of props to reference by $first.
   *
   * @returns {Object} The aggregation stage object.
   *
   * @throws {Error} If any of the parameters is of wrong type.
   *
   * @example
   * const props = ['$year', '$brand', '$color'];
   *
   * const stage = filter.keywordsGroup(props);
   *
   * // Stage will be:
   * $group: {
   *   {
   *     _id: '$_id',
   *     _filter_score: {
   *       $first: '$_filter_score',
   *     },
   *     _filter_slug: {
   *       $first: '$_filter_slug',
   *     },
   *
   *     year: {
   *       $first: '$year'
   *     },
   *     brand: {
   *       $first: '$brand'
   *     },
   *     color: {
   *       $first: '$color'
   *     }
   *   }
   * }
   */
  static keywordsGroup (props) {
    if (is.not.array(props)) {
      throw new Error('The props argument must be a String Array.');
    }

    const $group = {
      _id: '$_id',
      _filter_score: {
        $first: '$_filter_score',
      },
      _filter_slug: {
        $first: '$_filter_slug',
      },
    };

    props.forEach((prop) => {
      $group[prop] = {
        $first: `$${prop}`,
      };
    });

    return {
      $group,
    };
  }

  /**
   * Builds the filter's slug $addFields aggregation stage.
   *
   * @param {String[]} fields Field references to add.
   *
   * @returns {Object} The aggregation stage object.
   *
   * @throws {Error} If any of the parameters is of wrong type.
   *
   * @example
   * const props = [
   *   '$brand', '$model', '$color', {
   *      $substrBytes: ['$year', 0, -1] // Convert Number to String
   *    }
   * ];
   *
   * const stage = filter.keywordsSlug(props);
   *
   * // Stage will be:
   * $addFields: {
   *   _filter_slug: {
   *     $toLower: {
   *       $concat: [{
   *         $ifNull: ['$brand', '']
   *       }, {
   *         $ifNull: ['$model', '']
   *       }, {
   *         $ifNull: ['$color', '']
   *       }, {
   *         $ifNull: [{
   *           $substrBytes: ['$year', 0, -1]
   *         }, '']
   *       }],
   *     },
   *   },
   * },
   */
  static keywordsSlug (fields) {
    if (is.not.array(fields)) {
      throw new Error('The fields argument must be a String Array.');
    }

    const concat = [];

    fields.forEach((field, i) => {
      concat.push({
        $ifNull: [field, ''],
      });

      if ((i + 1) < fields.length) {
        concat.push(' ');
      }
    });

    return {
      $addFields: {
        _filter_slug: {
          $toLower: {
            $concat: concat,
          },
        },
      },
    };
  }

  /**
   * Builds the filter by keywords aggregation stages.
   *
   * @param {String} keywords Keywords string to split by white spaces.
   * @param {Object} slug Slug $addFields prebuilt stage.
   * @param {Object} group $group results prebuilt stage.
   * @param {Object} options $facet options
   * // {
   * //  exact: true/false,
   * //  mixed: true/false,
   * //  fuzzy: true/false
   * // }
   *
   * @returns {Object[]} The aggregation stages object array.
   *
   * @throws {Error} If any of the parameters is of wrong type.
   *
   * @example
   * const group = filter.keywordsGroup(groupProps);
   * const slug = filter.keywordsSlug(slugProps);
   * const keywords = 'hello world';
   *
   * const stage = filter.byKeywords(keywords, slug, group);
   *
   * // Stage output is too large to place here but it creates a $facet stage
   * // filter and assigns a score to the results by exact (3), mixed (2), or
   * // fuzzy (1) matches and then concatenates, groups to remove duplicates and
   * // sorts the results by their score.
   */
  static byKeywords (keywords, slug, group, options = null) {
    if (is.not.string(keywords)) {
      throw new Error('The fields argument must be a String.');
    }

    if (is.not.object(slug)) {
      throw new Error('The slug argument must be an Object.');
    }

    if (is.not.object(group)) {
      throw new Error('The group argument must be an Object.');
    }

    const facet = {
      $facet: {
        /* Match exact results */
        exact: [{
          $match: {
            _filter_slug: regexer.exact(keywords),
          },
        }],

        /* Match mixed results */
        mixed: [{
          $match: {
            _filter_slug: regexer.mixed(keywords),
          },
        }],

        /* Match fuzzy results */
        fuzzy: [{
          $match: {
            _filter_slug: regexer.fuzzy(keywords),
          },
        }],
      },
    };

    if (options && options.exact === false) {
      delete facet.$facet.exact;
    }

    if (options && options.mixed === false) {
      delete facet.$facet.mixed;
    }

    if (options && options.fuzzy === false) {
      delete facet.$facet.fuzzy;
    }

    return [
      { ...slug },

      facet,

      { ...stages.unwindExact }, { ...stages.unwindMixed }, { ...stages.unwindFuzzy },
      { ...stages.searchScores }, { ...stages.searchGroupScores },
      { ...stages.searchConcatResults }, { ...stages.unwindResults },
      { ...stages.searchReplaceRoot }, { ...group }, { ...stages.searchNotNull },
      { ...stages.searchSort }
    ];
  }
}

module.exports = FiLter;
