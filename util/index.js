const functions = require('./functions.js');
const deployFtSimple = require('./ft-simple-deploy.js');
const deployFtQuadratic = require('./ft-quadratic-deploy.js');
const constants = require('./constants.js');

module.exports = {
  ...functions,
  constants,
  deployFtSimple,
  deployFtQuadratic,
};
