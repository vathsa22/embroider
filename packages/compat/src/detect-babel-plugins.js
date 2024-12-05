"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmberAutoImportDynamic = isEmberAutoImportDynamic;
exports.isCompactReexports = isCompactReexports;
exports.isColocationPlugin = isColocationPlugin;
exports.isInlinePrecompilePlugin = isInlinePrecompilePlugin;
const path_1 = require("path");
function isEmberAutoImportDynamic(item) {
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
    return pluginPath.includes((0, path_1.join)(path_1.sep, 'ember-auto-import', path_1.sep));
}
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
    return pluginPath.includes((0, path_1.join)('babel-plugin-compact-reexports', path_1.sep));
}
function isColocationPlugin(item) {
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
    return pluginPath.includes((0, path_1.join)('ember-cli-htmlbars', 'lib', 'colocated-babel-plugin', path_1.sep));
}
// tests for the classic ember-cli-htmlbars-inline-precompile babel plugin
function isInlinePrecompilePlugin(item) {
    if (typeof item === 'string') {
        return matchesSourceFile(item);
    }
    if (hasProperties(item) && item._parallelBabel) {
        return matchesSourceFile(item._parallelBabel.requireFile);
    }
    if (Array.isArray(item) && item.length > 0) {
        if (typeof item[0] === 'string') {
            return matchesSourceFile(item[0]);
        }
        if (hasProperties(item[0]) && item[0]._parallelBabel) {
            return matchesSourceFile(item[0]._parallelBabel.requireFile);
        }
    }
    return false;
}
function matchesSourceFile(filename) {
    return Boolean(htmlbarPathMatches.find(match => filename.endsWith(match)));
}
function hasProperties(item) {
    return item && (typeof item === 'object' || typeof item === 'function');
}
const htmlbarPathMatches = [
    ['htmlbars-inline-precompile', 'index.js'].join(path_1.sep),
    ['htmlbars-inline-precompile', 'lib', 'require-from-worker.js'].join(path_1.sep),
    ['htmlbars-inline-precompile', 'index'].join(path_1.sep),
    ['htmlbars-inline-precompile', 'lib', 'require-from-worker'].join(path_1.sep),
    ['ember-cli-htmlbars', 'index.js'].join(path_1.sep),
    ['ember-cli-htmlbars', 'lib', 'require-from-worker.js'].join(path_1.sep),
    ['ember-cli-htmlbars', 'index'].join(path_1.sep),
    ['ember-cli-htmlbars', 'lib', 'require-from-worker'].join(path_1.sep),
    ['babel-plugin-ember-template-compilation', 'src', 'node-main.js'].join(path_1.sep),
];
//# sourceMappingURL=detect-babel-plugins.js.map