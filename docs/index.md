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


### filter.excludeById(exclude) 

Builds an exclude by ID aggregation stage by adding excluded ids to a $nin
in a $match stage.

**Parameters**

**exclude**: `Array.&lt;String&gt; | Array.&lt;ObjectID&gt;`, Excluded ids array.

**Returns**: `Object`, The aggregation stage object.


### filter.keywordsGroup(props) 

Builds a $group stage, grouping by id, filter slug, filter score and adding
the list of props by their $first accumulator.

**Parameters**

**props**: `Array.&lt;String&gt;`, The list name of props to reference by $first.

**Returns**: `Object`, The aggregation stage object.


### filter.byNumRange(ranges, params) 

Builds a filter by numeric range $match stage.

**Parameters**

**ranges**: `Array.&lt;Object&gt;`, Numeric ranges object.

 - **ranges.name**: `String`, The range key name in the params object.

 - **ranges.field**: `String`, The range field name in the model.

 - **ranges.cond**: `String`, The range query condition (lte, gte, eq).

**params**: `Object`, Request query params object.

**Returns**: `Object`, The aggregation stage object.


### filter.keywordsSlug(fields) 

Builds the filter's slug $addFields aggregation stage.

**Parameters**

**fields**: `Array.&lt;String&gt;`, Field references to add.

**Returns**: `Object`, The aggregation stage object.


### filter.byKeywords(keywords, slugStage, groupStage) 

Builds the filter by keywords aggregation stages.

**Parameters**

**keywords**: `Array.&lt;String&gt;`, Words string array.

**slugStage**: `Object`, Slug $addFields prebuilt stage.

**groupStage**: `Object`, Group unique prebuilt pipeline stage.

**Returns**: `Array.&lt;Object&gt;`, The aggregation stages object array.



* * *










