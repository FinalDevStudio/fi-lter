'use strict';

const ObjectId = require('mongoose').Types.ObjectId;
const is = require('fi-is');

const regexer = require('./regexer');

const TRUE = 'true';
const SPACE = ' ';

const UNWIND_EXACT = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$exact'
  }
};

const UNWIND_MIXED = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$mixed'
  }
};

const UNWIND_FUZZY = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$fuzzy'
  }
};

const UNWIND_RESULTS = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$results'
  }
};

const SEARCH_SCORES = {
  $addFields: {
    'exact._filter._score': 3,
    'mixed._filter._score': 2,
    'fuzzy._filter._score': 1,
  }
};

const SEARCH_GROUP_SCORES = {
  $group: {
    _id: '$_id',
    exact: {
      $addToSet: '$exact'
    },
    mixed: {
      $addToSet: '$mixed'
    },
    fuzzy: {
      $addToSet: '$fuzzy'
    }
  }
};

const SEARCH_CONCAT_RESULTS = {
  $project: {
    results: {
      $concatArrays: [{
        $ifNull: ['$exact', []]
      }, {
        $ifNull: ['$mixed', []]
      }, {
        $ifNull: ['$fuzzy', []]
      }]
    }
  }
};

const SEARCH_REPLACE_ROOT = {
  $replaceRoot: {
    newRoot: {
      $ifNull: ['$results', []]
    }
  }
};

const SEARCH_NOT_NULL = {
  $match: {
    _id: {
      $ne: null
    }
  }
};

const SEARCH_SCORE_SORT = {
  $sort: {
    '_filter._score': -1
  }
};

/**
 * Filters by statuses.
 *
 * @param {String[]} props The status fields to filter.
 * @param {Object} params The query parameters.
 *
 * @returns {Object} The query conditions object.
 */
function buildFilterByPropertiesStage(props, params) {
  const $match = {};

  props.forEach(status => {
    if (params.hasOwnProperty(status)) {
      if (params[status] === TRUE) {
        $match[status] = {
          $ne: null
        };
      } else {
        $match[status] = null;
      }
    }
  });

  return {
    $match
  };
}

/**
 * Excludes results by ID.
 *
 * @param {Object} params Request query params.
 *
 * @returns {Object} Exclude conditions.
 */
function buildExcludeByIdStage(params) {
  const $nin = [];

  if (is.not.empty(params.exclude)) {
    let exclude;

    if (is.string(params.exclude)) {
      exclude = [params.exclude];
    }

    exclude.forEach((value) => {
      if (ObjectId.isValid(value)) {
        $nin.push(new ObjectId(value));
      }
    });
  }

  return {
    $match: {
      _id: {
        $nin
      }
    }
  };
}

/**
 * Builds a group by id stage adding the list of props by '$fisrt'.
 *
 * @param {String[]} props The list name of props to reference by '$fisrt'.
 *
 * @returns {Object} The group aggregate stage object.
 */
function buildGroupByIdWithFirstProps(props) {
  const $group = {
    _id: '$_id',
    _filter: {
      _score: {
        $first: '$_filter._score'
      },
      _slug: {
        $first: '$_filter._slug'
      }
    }
  };

  props.forEach((prop) => {
    $group[prop] = {
      $first: `$${prop}`
    };
  });

  return {
    $group
  };
}

/**
 * Filter by numeric range properties.
 *
 * @param {Object[]} ranges Numeric ranges object.
 * @param {String} ranges.name The range key name in the params object.
 * @param {String} ranges.filed The range field name in the model.
 * @param {String} ranges.cond The range query condition (lte, gte, eq).
 * @param {Object} params Request query params object.
 *
 * @returns {Object} The conditions object.
 */
function buildFilterByRangeStage(ranges, params) {
  const $match = {};

  ranges.forEach(range => {
    if (params.hasOwnProperty(range.name)) {
      let value = parseInt(params[range.name]);

      if (is.number(value) && value > 0) {
        $match[range.field] = {};
        $match[range.field][range.cond] = value;
      }
    }
  });

  return {
    $match
  };
}

/**
 * Builds the slug add fields aggregation pipeline stage.
 *
 * @param {String[]} fields Field references to add.
 *
 * @returns {Object} The stage object.
 */
function buildSlugAddFieldsStage(fields) {
  const concat = [];

  if (is.not.array(fields)) {
    throw new Error('Fields must be an array!');
  }

  fields.forEach((field, i) => {
    concat.push({
      $ifNull: [field, '']
    });

    if ((i + 1) < fields.length) {
      concat.push(SPACE);
    }
  });

  return {
    $addFields: {
      '_filter._slug': {
        $toLower: {
          $concat: concat
        }
      }
    }
  };
}

/**
 * Builds the keywords filter pipeline stages.
 *
 * @param {String[]} keywords Words string array.
 * @param {Object} slugStage Slug $addFields prebuilt stage.
 * @param {Object} groupStage Group unique prebuilt pipeline stage.
 *
 * @returns {Object[]} Aggregate pipeline stages.
 */
function buildKeywordsSearchStages(keywords, slugStage, groupStage) {
  return [slugStage,
    {
      $facet: {
        /* Match exact results */
        exact: [{
          $match: {
            '_filter._slug': regexer.exact(keywords)
          }
        }],

        /* Match mixed results */
        mixed: [{
          $match: {
            '_filter._slug': regexer.mixed(keywords)
          }
        }],

        /* Match fuzzy results */
        fuzzy: [{
          $match: {
            '_filter._slug': regexer.fuzzy(keywords)
          }
        }]
      }
    },

    UNWIND_EXACT, UNWIND_MIXED, UNWIND_FUZZY, SEARCH_SCORES,
    SEARCH_GROUP_SCORES, SEARCH_CONCAT_RESULTS, UNWIND_RESULTS,
    SEARCH_REPLACE_ROOT, groupStage, SEARCH_NOT_NULL, SEARCH_SCORE_SORT
  ];
}

module.exports = {

  buildKeywordsSearchStages,

  buildSlugAddFieldsStage,

  buildFilterByPropertiesStage,

  buildFilterByRangeStage,

  buildExcludeByIdStage,

  buildGroupByIdWithFirstProps

};
