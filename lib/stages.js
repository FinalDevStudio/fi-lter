module.exports.unwindExact = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$exact',
  },
};

module.exports.unwindMixed = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$mixed',
  },
};

module.exports.unwindFuzzy = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$fuzzy',
  },
};

module.exports.unwindResults = {
  $unwind: {
    preserveNullAndEmptyArrays: true,
    path: '$results',
  },
};

module.exports.searchScores = {
  $addFields: {
    'exact._filter_score': 3,
    'mixed._filter_score': 2,
    'fuzzy._filter_score': 1,
  },
};

module.exports.searchGroupScores = {
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

module.exports.searchConcatResults = {
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

module.exports.searchReplaceRoot = {
  $replaceRoot: {
    newRoot: {
      $ifNull: ['$results', []],
    },
  },
};

module.exports.searchNotNull = {
  $match: {
    _id: {
      $ne: null,
    },
  },
};

module.exports.searchSort = {
  $sort: {
    _filter_score: -1,
  },
};
