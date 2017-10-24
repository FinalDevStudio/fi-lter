'use strict';

const expect = require('chai').expect;
const mongoose = require('mongoose');
const filter = require('../');

const DB = 'fi-lter-test';

describe('Fi Lter', () => {
  before(next => {
    const options = {
      useMongoClient: true,
    };

    mongoose.Promise = Promise;

    mongoose
      .connect(`mongodb://localhost/${DB}`, options)
      .then(() => next())
      .catch(err => next(err));
  });

  it('should be an object', () => {
    expect(filter).to.be.an('object');
  });

  describe('Keyword Filter', () => {
    let Device;

    before(next => {
      Device = mongoose.model('device', new mongoose.Schema({
        brand: {
          type: String,
          required: true,
        },
        model: {
          type: String,
          required: true
        },
        year: {
          type: Number,
          required: true,
          min: 1990,
          max: new Date().getFullYear() + 1
        },
        serial: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        }
      }, {
        timestamps: true,
      }));

      const promises = [];

      require('./devices').forEach((device) => promises.push(Device.create(device)));

      Promise.all(promises)
        .then(() => next())
        .catch((err) => next(err));
    });

    it('should be 12 devices total', (next) => {
      Device.count()
        .then((count) => {
          expect(count).to.equal(12);
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
      .catch(err => next(err));
  });
});
