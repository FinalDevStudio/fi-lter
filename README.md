# Fi Lter

MongoDB and Mongoose aggregation filter and search helper.

This module is intended as a simple abstraction layer to perform basic but powerful matching with a concatenation of one or multiple model's fields.


### Diacritic Matching

The diacritic insensitive functionality is handled by [Fi Di Regex](https://github.com/FinalDevStudio/fi-di-regex). If you find an issue with this functionality, please open an issue in the [Fi Di Regex Issues](https://github.com/FinalDevStudio/fi-di-regex/issues) page.


## Important

Although this module's functionality is nearly complete the documentation is still in progress. In the meantime, the [docs](https://finaldevstudio.github.io/fi-lter) may help you a bit.


## Installation

```sh
npm i fi-lter
```

Remember to use `--save` if you're using a NPM version less than 5.x.x.


## Usage

```js
const mongoose = require('mongoose');
const filter = require('fi-lter');

/* Let's assume this is the string the user provided */
const queryText = 'google';

/**
 * This are the fields you want to search in and will be used to generate a slug
 * field where the diacritic-insensitive matching will occur.
 *
 * IMPORTANT: This stage should be prebuilt unless you use dynamic values.
 */
const KEYWORDS_SLUG = filter.keywordsSlug([
  '$brand', '$model', '$color', '$serial', {
    $substrBytes: ['$year', 0, -1] // Convert Number to String
  }
]);

/**
 * This are the fields you want to keep after grouping the results by _id.
 *
 * They will be added using a $group stage with a $first match.
 *
 * IMPORTANT: This stage should be prebuilt unless you use dynamic values.
 */
const KEYWORDS_GROUP = filter.keywordsGroup([
  'brand', 'model', 'year', 'serial', 'price', 'createdAt', 'updatedAt'
]);

/* This example uses a device's information as source */
Device = mongoose.model('device', new mongoose.Schema({
  brand: String,
  model: String,
  color: String,
  serial: String,
  year: Number,
  price: Number
}, {
  timestamps: true
}));

/* Start by creating an aggregation query */
const query = Device.aggregate();

// Initial aggregation stages...
// E.g.: query.match({...});

/* Build and append the keyword filter stages */
query.append(filter.byKeywords(queryText, KEYWORDS_SLUG, KEYWORDS_GROUP));

// More aggregation stages...
// E.g.: query.project({...});

query.then(results => {
  /* Here, results should be an Array of Devices matching 'google' by their
   * brand, model, year, serial or color, sorted by their match score */
  console.log(results);
}).catch((err) => {
  console.error(err);
});
```
