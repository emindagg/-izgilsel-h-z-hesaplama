(function (globalScope) {
  function createInitialStep1State() {
    return {
      hasActivated: false,
      choicesVisible: false,
      triggerHidden: false,
      triggerDisabled: false,
      shouldStartAnimation: false,
      showSpeeds: false
    };
  }

  function activateStep1(currentState) {
    const state = currentState || createInitialStep1State();

    if (state.hasActivated) {
      return {
        ...state,
        shouldStartAnimation: false
      };
    }

    return {
      hasActivated: true,
      choicesVisible: true,
      triggerHidden: true,
      triggerDisabled: true,
      shouldStartAnimation: true,
      showSpeeds: false
    };
  }

  const api = {
    createInitialStep1State,
    activateStep1
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.Step1State = api;
})(typeof window !== 'undefined' ? window : globalThis);
