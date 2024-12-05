"use strict";
// As of ember-cli@3.28, addon instances _may_ be proxied. This can become a
// problem when patching (setting/restoring) methods on the addon instance or
// comparing with the addon `__proto__`. The purpose of this util method is to
// correctly return the _real_ (original) addon instance and not the proxy.
// @see https://github.com/ember-cli/ember-cli/pull/9487
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getRealAddon;
let TARGET_INSTANCE_SYMBOL;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const targetInstanceModule = require('ember-cli/lib/models/per-bundle-addon-cache/target-instance');
    if (targetInstanceModule) {
        TARGET_INSTANCE_SYMBOL = targetInstanceModule.TARGET_INSTANCE;
    }
}
catch (e) {
    // we only want to handle the error when this module isn't found; i.e.,
    // when a consumer of `ember-engines` is using an old version of `ember-cli`
    // (less than `ember-cli` 3.28)
    if (!e || e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
}
/**
 * Given an addon instance, gets the _real_ addon instance
 * @param maybeProxyAddon - the addon instance, which may be a proxy
 * @returns the _real_ (not proxied) addon instance
 */
function getRealAddon(maybeProxyAddon) {
    return (TARGET_INSTANCE_SYMBOL && maybeProxyAddon[TARGET_INSTANCE_SYMBOL]) || maybeProxyAddon;
}
//# sourceMappingURL=get-real-addon.js.map