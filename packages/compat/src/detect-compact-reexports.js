"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompactReexports = isCompactReexports;
function isCompactReexports(item) {
    let pluginPath;
    if (typeof item === 'string') {
        pluginPath = item;
    }
    else if (Array.isArray(item) && item.length > 0 && typeof item[0] === 'string') {
        pluginPath = item[0];
    }
    else {
        return false;
    }
    return /(^|\/)babel-plugin-compact-reexports\//.test(pluginPath);
}
//# sourceMappingURL=detect-compact-reexports.js.map