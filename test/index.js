const mongoose = require('mongoose');
const { expect } = require('chai');
const Chance = require('chance');

const people = require('./people')(12);
const filter = require('../');

const chance = new Chance();

describe('Fi Lter', () => {
  const DB = 'fi-lter-test';

  before(next => {
    const options = {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      autoIndex: false
      // useMongoClient: true
    };

    mongoose.Promise = Promise;

    mongoose
      .connect(`mongodb://localhost/${DB}`, options)
      .then(() => next())
      .catch(err => next(err));
  });

  it('should be a function', () => {
    expect(filter).to.be.a('function');
  });

  describe('Keyword Filter', () => {
    let Person;

    const SLUG_ADDFIELDS = filter.keywordsSlug(['$firstname', '$lastname', '$gender', '$ssn']);

    const GROUP_BY_ID = filter.keywordsGroup(['firstname', 'lastname', 'gender', 'ssn', 'createdAt', 'updatedAt']);

    before(next => {
      Person = mongoose.model(
        'person',
        new mongoose.Schema(
          {
            firstname: {
              type: String,
              required: true
            },
            lastname: {
              type: String,
              required: true
            },
            birthdate: {
              type: Date,
              required: true
            },
            ssn: {
              type: String,
              required: true,
              unique: true
            },
            gender: {
              type: String,
              required: true,
              enum: ['male', 'female']
            }
          },
          {
            timestamps: true
          }
        )
      );

      const promises = [];

      people.forEach(person => promises.push(Person.create(person)));

      Promise.all(promises)
        .then(() => next())
        .catch(next);
    });

    it(`should be ${people.length} people total`, next => {
      Person.countDocuments()

        .then(count => {
          expect(count).to.equal(people.length);
          next();
        })

        .catch(next);
    });

    it('should find people by their firstname', next => {
      const i = chance.integer({ min: 0, max: people.length - 1 });
      const queryText = people[i].firstname;
      const query = Person.aggregate();

      query.append(filter.byKeywords(queryText, SLUG_ADDFIELDS, GROUP_BY_ID));

      query
        .then(results => {
          expect(results.length).to.be.greaterThan(0);
          next();
        })
        .catch(next);
    });

    it('should find people by their lastname', next => {
      const i = chance.integer({ min: 0, max: people.length - 1 });
      const queryText = people[i].lastname;
      const query = Person.aggregate();

      query.append(filter.byKeywords(queryText, SLUG_ADDFIELDS, GROUP_BY_ID));

      query
        .then(results => {
          expect(results.length).to.be.greaterThan(0);
          next();
        })
        .catch(next);
    });

    it('should find people by their gender', next => {
      const queryText = chance.gender().toLocaleLowerCase();
      const query = Person.aggregate();

      query.append(filter.byKeywords(queryText, SLUG_ADDFIELDS, GROUP_BY_ID));

      query
        .then(results => {
          expect(results.length).to.be.greaterThan(0);
          next();
        })
        .catch(next);
    });

    it('should find a person by their SSN', next => {
      const i = chance.integer({ min: 0, max: people.length - 1 });
      const queryText = people[i].ssn;
      const query = Person.aggregate();

      query.append(filter.byKeywords(queryText, SLUG_ADDFIELDS, GROUP_BY_ID));

      query
        .then(results => {
          expect(results.length).to.be.greaterThan(0);
          next();
        })
        .catch(next);
    });
  });

  after(next => {
    mongoose.connection
      .dropDatabase()
      .then(() => mongoose.disconnect())
      .then(() => next())
      .catch(next);
  });
});
