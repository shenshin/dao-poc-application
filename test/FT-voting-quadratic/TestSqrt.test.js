const { expect } = require('chai');
const { deployContract } = require('../../util');

describe('FixedPointMathLab', () => {
  let testSqrt;

  before(async () => {
    testSqrt = await deployContract('TestSqrt');
  });

  it('should calculate square roots', async () => {
    expect(await testSqrt.sqrt(100)).to.equal(10);
    expect(await testSqrt.sqrt(10000)).to.equal(100);
    expect(await testSqrt.sqrt(0)).to.equal(0);
    expect(await testSqrt.sqrt(1)).to.equal(1);
    expect(await testSqrt.sqrt(2704)).to.equal(52);
    expect(await testSqrt.sqrt(110889)).to.equal(333);
    expect(await testSqrt.sqrt(32239684)).to.equal(5678);
  });
});
