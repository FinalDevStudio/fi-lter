module.exports.UNWIND_EXACT = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$exact',
  },
};

module.exports.UNWIND_MIXED = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$mixed',
  },
};

module.exports.UNWIND_FUZZY = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$fuzzy',
  },
};

module.exports.UNWIND_RESULTS = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$results',
  },
};

module.exports.SEARCH_SCORES = {
  $addFields: {
    'exact._filter_score': 3,
    'mixed._filter_score': 2,
    'fuzzy._filter_score': 1,
  },
};

module.exports.SEARCH_GROUP_SCORES = {
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

module.exports.SEARCH_CONCAT_RESULTS = {
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

module.exports.SEARCH_REPLACE_ROOT = {
  $replaceRoot: {
    newRoot: {
      $ifNull: ['$results', []],
    },
  },
};

module.exports.SEARCH_NOT_NULL = {
  $match: {
    _id: {
      $ne: null,
    },
  },
};

module.exports.SEARCH_SCORE_SORT = {
  $sort: {
    _filter_score: -1,
  },
};
