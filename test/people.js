const Chance = require('chance');

const chance = new Chance();

module.exports = (count) => {
  const ssns = chance.unique(chance.ssn, count);
  const people = [];

  for (let i = 0; i < count; i += 1) {
    const gender = chance.gender().toLowerCase();

    people.push({
      firstname: chance.first({ gender }),
      lastname: chance.last(),
      birthdate: chance.birthday(),
      ssn: ssns[i],
      gender,
    });
  }

  return people;
};
