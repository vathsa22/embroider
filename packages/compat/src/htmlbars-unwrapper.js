"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapPlugin = unwrapPlugin;
function unwrapPlugin(params) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(params.requireFile)[params.buildUsing](params.params).plugin;
}
//# sourceMappingURL=htmlbars-unwrapper.js.map