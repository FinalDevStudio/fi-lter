# filter





* * *

### filter.byFields(fields, params) 

Builds a filter by fields aggregation stage by checking whether the params
value with the same name is truthy or falsy and filters by not null or null
respectively in a $match stage.

**Parameters**

**fields**: `Array.&lt;String&gt;`, The fields to filter.

**params**: `Object`, The parameters object.

**Returns**: `Object`, The aggregation stage object.

**Example**:
```js
const fields = ['disabledAt', 'createdAt', 'updatedAt'];

const params = {
  disabledAt: false,
};

const stage = filter.byFields(fields, params);

// Stage will be:
{
  $match: {
    disabledAt: {
      $ne: null
    }
  }
}
```


### filter.excludeById(exclude) 

Builds an exclude by _id aggregation stage by adding excluded Object Ids to a
$nin inside a $match stage.

**Parameters**

**exclude**: `Array.&lt;String&gt; | Array.&lt;ObjectID&gt;`, Excluded ids array.

**Returns**: `Object`, The aggregation stage object.

**Example**:
```js
const exclude = [
  '59f1d626a787d654433ecff4', '59f1d627a787d654433ecff5',
  '59f1d627a787d654433ecff6', '59f1d627a787d654433ecff7',
];

const stage = filter.excludeById(exclude);

// Stage will be:
$match: {
  _id: {
    $nin: [
      ObjectId('59f1d626a787d654433ecff4'),
      ObjectId('59f1d627a787d654433ecff5'),
      ObjectId('59f1d627a787d654433ecff6'),
      ObjectId('59f1d627a787d654433ecff7'),
    ]
  }
}
```


### filter.byNumRange(ranges, params) 

Builds a filter by numeric range $match stage using $and conditions for each
field.

**Parameters**

**ranges**: `Array.&lt;Object&gt;`, Numeric ranges object.

 - **ranges.name**: `String`, The range key name in the params object.

 - **ranges.field**: `String`, The range field name in the model.

 - **ranges.cond**: `String`, The range query condition ($lte, $gte, $eq).

**params**: `Object`, Request query params object.

**Returns**: `Object`, The aggregation stage object.

**Example**:
```js
const ranges = [{
  name: 'yearFrom',
  field: 'year',
  cond: '$gte',
}, {
  name: 'yearTo',
  field: 'year',
  cond: '$lte',
}];

const params = {
  yearFrom: 2012,
  yearTo: 2017,
};

const stage = filter.byNumRange(ranges, params);

// Stage will be:
$match: {
  $and: [{
    year: {
      $gte: 2012
    }
  }, {
    year: {
      $lte: 2017
    }
  }]
}
```


### filter.keywordsGroup(props) 

Builds a $group stage, grouping by id, filter slug, filter score and adding
the list of props by their $first accumulator.

**Parameters**

**props**: `Array.&lt;String&gt;`, The list name of props to reference by $first.

**Returns**: `Object`, The aggregation stage object.

**Example**:
```js
const props = ['$year', '$brand', '$color'];

const stage = filter.keywordsGroup(props);

// Stage will be:
$group: {
  {
    _id: '$_id',
    _filter_score: {
      $first: '$_filter_score',
    },
    _filter_slug: {
      $first: '$_filter_slug',
    },

    year: {
      $first: '$year'
    },
    brand: {
      $first: '$brand'
    },
    color: {
      $first: '$color'
    }
  }
}
```


### filter.keywordsSlug(fields) 

Builds the filter's slug $addFields aggregation stage.

**Parameters**

**fields**: `Array.&lt;String&gt;`, Field references to add.

**Returns**: `Object`, The aggregation stage object.

**Example**:
```js
const props = [
  '$brand', '$model', '$color', {
     $substrBytes: ['$year', 0, -1] // Convert Number to String
   }
];

const stage = filter.keywordsSlug(props);

// Stage will be:
$addFields: {
  _filter_slug: {
    $toLower: {
      $concat: [{
        $ifNull: ['$brand', '']
      }, {
        $ifNull: ['$model', '']
      }, {
        $ifNull: ['$color', '']
      }, {
        $ifNull: [{
          $substrBytes: ['$year', 0, -1]
        }, '']
      }],
    },
  },
},
```


### filter.byKeywords(keywords, slug, group) 

Builds the filter by keywords aggregation stages.

**Parameters**

**keywords**: `String`, Keywords string to split by white spaces.

**slug**: `Object`, Slug $addFields prebuilt stage.

**group**: `Object`, $group results prebuilt stage.

**Returns**: `Array.&lt;Object&gt;`, The aggregation stages object array.

**Example**:
```js
const group = filter.keywordsGroup(groupProps);
const slug = filter.keywordsSlug(slugProps);
const keywords = 'hello world';

const stage = filter.byKeywords(keywords, slug, group);

// Stage output is too large to place here but it creates a $facet stage
// filter and assigns a score to the results by exact (3), mixed (2), or
// fuzzy (1) matches and then concatenates, groups to remove duplicates and
// sorts the results by their score.
```



* * *










