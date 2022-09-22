const path = require('path');

const contracts = path.join(__dirname, 'deployments', 'contracts.json');
const external = path.join(__dirname, 'deployments', 'external.json');

module.exports = {
  contracts,
  external,
};
