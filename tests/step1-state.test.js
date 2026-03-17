const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createInitialStep1State,
  activateStep1
} = require('../step1-state.js');

test('ilk durumda seçenekler gizli ve tetikleyici görünür', () => {
  const state = createInitialStep1State();

  assert.equal(state.hasActivated, false);
  assert.equal(state.choicesVisible, false);
  assert.equal(state.triggerHidden, false);
  assert.equal(state.triggerDisabled, false);
  assert.equal(state.shouldStartAnimation, false);
});

test('ilk tetiklemede animasyon başlar ve seçenekler açılır', () => {
  const nextState = activateStep1(createInitialStep1State());

  assert.equal(nextState.hasActivated, true);
  assert.equal(nextState.choicesVisible, true);
  assert.equal(nextState.triggerHidden, true);
  assert.equal(nextState.triggerDisabled, true);
  assert.equal(nextState.shouldStartAnimation, true);
});

test('ikinci tetikleme yeni animasyon başlatmaz', () => {
  const activeState = activateStep1(createInitialStep1State());
  const repeatedState = activateStep1(activeState);

  assert.equal(repeatedState.hasActivated, true);
  assert.equal(repeatedState.choicesVisible, true);
  assert.equal(repeatedState.triggerHidden, true);
  assert.equal(repeatedState.triggerDisabled, true);
  assert.equal(repeatedState.shouldStartAnimation, false);
});
