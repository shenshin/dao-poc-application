const { expect } = require('chai');
const { deployContract } = require('../../util');

describe('Inheritance', () => {
  let html;

  before(async () => {
    html = await deployContract('HTML');
  });

  it('should inherit', async () => {
    const width = await html.getWidth();
    console.log(width);
    // expect(await testSqrt.sqrt(100)).to.equal(10);
  });
});
