"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = inlineHBSTransform;
function inlineHBSTransform() {
    return {
        visitor: {
            ImportDefaultSpecifier(path) {
                if (path.node.local.name === 'require') {
                    path.scope.rename('require');
                }
            },
        },
    };
}
//# sourceMappingURL=rename-require-plugin.js.map