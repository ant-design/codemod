const tests = ['basic', 'forked-misc'];

const defineTest = require('jscodeshift/src/testUtils').defineTest;

const testUnit = 'v3-Modal-method-with-icon-to-v4';

describe(testUnit, () => {
  tests.forEach(test =>
    defineTest(
      __dirname,
      testUnit,
      { antdPkgNames: ['antd', '@forked/antd'].join(',') },
      `${testUnit}/${test}`,
      { parser: 'babylon' },
    ),
  );
});
