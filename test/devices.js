const faker = require('faker');

module.exports = [];

const addDevice = (brand, model, year) => {
  module.exports.push({
    brand,
    model,
    year,
    serial: `${brand.charAt(0).toUpperCase()}${model.charAt(0).toUpperCase()}-${faker.random.uuid()}`,
    price: parseFloat(faker.commerce.price())
  });
};

addDevice('Google', 'Nexus 5', 2013);
addDevice('Google', 'Nexus 6', 2014);
addDevice('Google', 'Pixel', 2016);
addDevice('Google', 'Pixel 2 XL', 2017);
addDevice('HTC', 'One X', 2013);
addDevice('HTC', 'One M9', 2015);
addDevice('HTC', 'One M9', 2015);
addDevice('HTC', 'U Ultra', 2017);
addDevice('Huawei', 'P10', 2017);
addDevice('Huawei', 'Mate 8', 2016);
addDevice('LG', 'V20', 2016);
addDevice('LG', 'G6', 2017);
