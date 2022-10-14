const path = require('path');

const contracts = path.join(__dirname, 'deployments', 'contracts.json');
const external = path.join(__dirname, 'deployments', 'external.json');
const frontAbiDir = path.join(
  __dirname,
  '..',
  '..',
  'front',
  'src',
  'contracts',
);

module.exports = {
  contracts,
  external,
  frontAbiDir,
};
