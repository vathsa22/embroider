"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendedOptions = void 0;
exports.optionsWithDefaults = optionsWithDefaults;
const core_1 = require("@embroider/core");
const defaults = Object.assign((0, core_1.optionsWithDefaults)(), {
    staticAddonTrees: false,
    staticAddonTestSupportTrees: false,
    staticEmberSource: false,
    compatAdapters: new Map(),
    extraPublicTrees: [],
    workspaceDir: null,
    packageRules: [],
    allowUnsafeDynamicComponents: false,
});
function optionsWithDefaults(options) {
    return Object.assign({}, defaults, options);
}
// These are recommended configurations for addons to test themselves under. By
// keeping them here, it's easier to do ecosystem-wide compatibility testing.
// See the `@embroider/test-setup` package which can help consume these to test
// them in CI.
exports.recommendedOptions = Object.freeze({
    safe: Object.freeze({}),
    optimized: Object.freeze({
        staticAddonTrees: true,
        staticAddonTestSupportTrees: true,
        staticHelpers: true,
        staticModifiers: true,
        staticComponents: true,
        staticEmberSource: true,
        allowUnsafeDynamicComponents: false,
    }),
});
//# sourceMappingURL=options.js.map