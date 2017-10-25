const { ObjectID } = require('mongodb');
const is = require('fi-is');

const regexer = require('./regexer');

const TRUE = 'true';
const SPACE = ' ';

const UNWIND_EXACT = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$exact',
  },
};

const UNWIND_MIXED = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$mixed',
  },
};

const UNWIND_FUZZY = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$fuzzy',
  },
};

const UNWIND_RESULTS = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$results',
  },
};

const SEARCH_SCORES = {
  $addFields: {
    'exact._filter_score': 3,
    'mixed._filter_score': 2,
    'fuzzy._filter_score': 1,
  },
};

const SEARCH_GROUP_SCORES = {
  $group: {
    _id: '$_id',
    exact: {
      $addToSet: '$exact',
    },
    mixed: {
      $addToSet: '$mixed',
    },
    fuzzy: {
      $addToSet: '$fuzzy',
    },
  },
};

const SEARCH_CONCAT_RESULTS = {
  $project: {
    results: {
      $concatArrays: [{
        $ifNull: ['$exact', []],
      }, {
        $ifNull: ['$mixed', []],
      }, {
        $ifNull: ['$fuzzy', []],
      }],
    },
  },
};

const SEARCH_REPLACE_ROOT = {
  $replaceRoot: {
    newRoot: {
      $ifNull: ['$results', []],
    },
  },
};

const SEARCH_NOT_NULL = {
  $match: {
    _id: {
      $ne: null,
    },
  },
};

const SEARCH_SCORE_SORT = {
  $sort: {
    _filter_score: -1,
  },
};

/**
 * Builds a filter by fields aggregation stage by checking whether the params
 * value with the same name is truthy or falsy and filters by not null or null
 * respectively in a $match stage.
 *
 * @param {String[]} fields The fields to filter.
 * @param {Object} params The parameters object.
 *
 * @returns {Object} The aggregation stage object.
 */
function byFields(fields, params) {
  const $match = {};

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(params, field)) {
      if (params[field] === TRUE) {
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
 * Builds an exclude by ID aggregation stage by adding excluded ids to a $nin
 * in a $match stage.
 *
 * @param {String[]|ObjectID[]} exclude Excluded ids array.
 *
 * @returns {Object} The aggregation stage object.
 */
function excludeById(exclude) {
  const $nin = [];

  if (is.not.empty(exclude)) {
    let ids;

    if (is.string(exclude)) {
      ids = [exclude];
    }

    ids.forEach((value) => {
      if (ObjectID.isValid(value)) {
        $nin.push(new ObjectID(value));
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
 * Builds a $group stage, grouping by id, filter slug, filter score and adding
 * the list of props by their $first accumulator.
 *
 * @param {String[]} props The list name of props to reference by $first.
 *
 * @returns {Object} The aggregation stage object.
 */
function keywordsGroup(props) {
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
 * Builds a filter by numeric range $match stage.
 *
 * @param {Object[]} ranges Numeric ranges object.
 * @param {String} ranges.name The range key name in the params object.
 * @param {String} ranges.field The range field name in the model.
 * @param {String} ranges.cond The range query condition (lte, gte, eq).
 * @param {Object} params Request query params object.
 *
 * @returns {Object} The aggregation stage object.
 */
function byNumRange(ranges, params) {
  const $match = {};

  ranges.forEach((range) => {
    if (Object.prototype.hasOwnProperty.call(params, range.name)) {
      const num = parseFloat(params[range.name], 10);

      if (is.number(num) && num > 0) {
        $match[range.field] = {};
        $match[range.field][range.cond] = num;
      }
    }
  });

  return {
    $match,
  };
}

/**
 * Builds the filter's slug $addFields aggregation stage.
 *
 * @param {String[]} fields Field references to add.
 *
 * @returns {Object} The aggregation stage object.
 */
function keywordsSlug(fields) {
  const concat = [];

  fields.forEach((field, i) => {
    concat.push({
      $ifNull: [field, ''],
    });

    if ((i + 1) < fields.length) {
      concat.push(SPACE);
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
 * @param {String[]} keywords Words string array.
 * @param {Object} slugStage Slug $addFields prebuilt stage.
 * @param {Object} groupStage Group unique prebuilt pipeline stage.
 *
 * @returns {Object[]} The aggregation stages object array.
 */
function byKeywords(keywords, slugStage, groupStage) {
  return [slugStage,
    {
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
    },

    UNWIND_EXACT, UNWIND_MIXED, UNWIND_FUZZY, SEARCH_SCORES,
    SEARCH_GROUP_SCORES, SEARCH_CONCAT_RESULTS, UNWIND_RESULTS,
    SEARCH_REPLACE_ROOT, groupStage, SEARCH_NOT_NULL, SEARCH_SCORE_SORT,
  ];
}

module.exports = {

  byFields,

  byNumRange,

  excludeById,

  keywordsGroup,

  keywordsSlug,

  byKeywords,

};
