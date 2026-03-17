const test = require('node:test');
const assert = require('node:assert/strict');

const { registerWindowHandlers } = require('../browser-handlers.js');

test('inline handlerlar window nesnesine açıkça bağlanır', () => {
  const target = {};
  const handlers = {
    activateStep1Challenge() {},
    toggleSim() {}
  };

  const result = registerWindowHandlers(target, handlers);

  assert.equal(result, target);
  assert.equal(target.activateStep1Challenge, handlers.activateStep1Challenge);
  assert.equal(target.toggleSim, handlers.toggleSim);
});
