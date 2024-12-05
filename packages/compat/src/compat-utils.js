"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPeerDependency = addPeerDependency;
exports.forceIncludeModule = forceIncludeModule;
exports.forceIncludeTestModule = forceIncludeTestModule;
exports.stripBadReexportsPlugin = stripBadReexportsPlugin;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const resolve_1 = __importDefault(require("resolve"));
const path_1 = require("path");
function addPeerDependency(packageJSON, packageName, version = '*') {
    let pkg = (0, cloneDeep_1.default)(packageJSON);
    if (!pkg.peerDependencies) {
        pkg.peerDependencies = {};
    }
    pkg.peerDependencies[packageName] = version;
    return pkg;
}
function forceIncludeModule(meta, localPath) {
    meta = (0, cloneDeep_1.default)(meta);
    if (!meta.hasOwnProperty('implicit-modules')) {
        meta['implicit-modules'] = [];
    }
    meta['implicit-modules'].push(localPath);
    return meta;
}
function forceIncludeTestModule(meta, localPath) {
    meta = (0, cloneDeep_1.default)(meta);
    if (!meta.hasOwnProperty('implicit-test-modules')) {
        meta['implicit-test-modules'] = [];
    }
    meta['implicit-test-modules'].push(localPath);
    return meta;
}
// A babel plugin that removes reexports that point at nonexistent files.
// Unfortunately needed because some popular addons have bogus unused reexports.
//
// Append the output of this function to the `plugins` array in a babel config.
function stripBadReexportsPlugin(opts = {}) {
    return [stripBadReexportsTransform, { filenamePattern: opts.filenamePattern, resolveBase: opts.resolveBase }];
}
function stripBadReexportsTransform() {
    return {
        visitor: {
            ExportNamedDeclaration(path, state) {
                if ((!state.opts.filenamePattern || state.opts.filenamePattern.test(path.hub.file.opts.filename)) &&
                    path.node.source &&
                    path.node.source.type === 'StringLiteral') {
                    try {
                        resolve_1.default.sync(path.node.source.value, { basedir: state.opts.resolveBase });
                    }
                    catch (err) {
                        path.remove();
                    }
                }
            },
        },
    };
}
stripBadReexportsTransform.baseDir = function () {
    return (0, path_1.resolve)(__dirname, '..');
};
//# sourceMappingURL=compat-utils.js.map