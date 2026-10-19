import React from 'react';

/**
 * Thin base class used by the ported screens. Each screen keeps its original controller
 * (`state`, handlers, `renderVals()`) and the converted JSX lives in `view(scope)`.
 * `scope` = props overlaid with the values returned by `renderVals()` (same rule as the prototype).
 * Migrate a screen to hooks by moving `renderVals()` into a function component and reading `scope` directly.
 */
export abstract class DCLogic<P = any, S = any> extends React.Component<P, S> {
  renderVals(): Record<string, any> {
    return {};
  }
  abstract view(scope: Record<string, any>): React.ReactNode;
  render() {
    return this.view({ ...(this.props as object), ...this.renderVals() });
  }
}
