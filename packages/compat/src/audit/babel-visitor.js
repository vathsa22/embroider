"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeFrameStorage = exports.VisitorState = void 0;
exports.isNamespaceMarker = isNamespaceMarker;
exports.auditJS = auditJS;
const traverse_1 = __importDefault(require("@babel/traverse"));
const core_1 = require("@babel/core");
const code_frame_1 = require("@babel/code-frame");
class VisitorState {
}
exports.VisitorState = VisitorState;
function isNamespaceMarker(value) {
    return typeof value !== 'string';
}
// babelConfig must include { ast: true }
function auditJS(rawSource, filename, babelConfig, frames) {
    let imports = [];
    let exports = new Set();
    let problems = [];
    /* eslint-disable @typescript-eslint/no-inferrable-types */
    // These are not really inferrable. Without explicit declarations, TS thinks
    // they're always false because it doesn't know the handler methods run
    // synchronously
    let sawModule = false;
    let sawExports = false;
    let sawDefine = false;
    /* eslint-enable @typescript-eslint/no-inferrable-types */
    let { ast, code } = (0, core_1.transformSync)(rawSource, Object.assign({ filename: filename }, babelConfig));
    let saveCodeFrame = frames.forSource(rawSource);
    (0, traverse_1.default)(ast, {
        Identifier(path) {
            if (path.node.name === 'module' && isFreeVariable(path)) {
                sawModule = true;
            }
            else if (path.node.name === 'exports' && isFreeVariable(path)) {
                sawExports = true;
            }
            else if (path.node.name === 'define' && isFreeVariable(path)) {
                sawDefine = true;
            }
            if (inExportDeclarationContext(path)) {
                exports.add(path.node.name);
            }
        },
        CallExpression(path) {
            let callee = path.get('callee');
            if (callee.referencesImport('@embroider/macros', 'importSync') || core_1.types.isImport(callee.node)) {
                let arg = path.node.arguments[0];
                if (arg.type === 'StringLiteral') {
                    imports.push({
                        source: arg.value,
                        codeFrameIndex: saveCodeFrame(arg),
                        specifiers: [],
                    });
                }
                else {
                    problems.push({
                        message: `audit tool is unable to understand this usage of ${core_1.types.isImport(callee.node) ? 'import' : 'importSync'}`,
                        detail: arg.type,
                        codeFrameIndex: saveCodeFrame(arg),
                    });
                }
            }
        },
        ImportDeclaration(path) {
            imports.push({
                source: path.node.source.value,
                codeFrameIndex: saveCodeFrame(path.node.source),
                specifiers: [],
            });
        },
        ImportDefaultSpecifier(path) {
            imports[imports.length - 1].specifiers.push({
                name: 'default',
                local: path.node.local.name,
                codeFrameIndex: saveCodeFrame(path.node),
            });
        },
        ImportNamespaceSpecifier(path) {
            imports[imports.length - 1].specifiers.push({
                name: { isNamespace: true },
                local: path.node.local.name,
                codeFrameIndex: saveCodeFrame(path.node),
            });
        },
        ImportSpecifier(path) {
            imports[imports.length - 1].specifiers.push({
                name: name(path.node.imported),
                local: path.node.local.name,
                codeFrameIndex: saveCodeFrame(path.node),
            });
        },
        ExportDefaultDeclaration(_path) {
            exports.add('default');
        },
        ExportSpecifier(path) {
            exports.add(name(path.node.exported));
            if (path.parent.type === 'ExportNamedDeclaration' && path.parent.source) {
                imports[imports.length - 1].specifiers.push({
                    name: name(path.node.local),
                    local: null, // re-exports don't create local bindings
                    codeFrameIndex: saveCodeFrame(path.node),
                });
            }
        },
        ExportNamespaceSpecifier(path) {
            exports.add(name(path.node.exported));
            if (path.parent.type === 'ExportNamedDeclaration' && path.parent.source) {
                imports[imports.length - 1].specifiers.push({
                    name: { isNamespace: true },
                    local: null, // re-exports don't create local bindings
                    codeFrameIndex: saveCodeFrame(path.node),
                });
            }
        },
        ExportAllDeclaration(path) {
            exports.add({ all: path.node.source.value });
            imports.push({
                source: path.node.source.value,
                codeFrameIndex: saveCodeFrame(path.node.source),
                specifiers: [
                    {
                        name: { isNamespace: true },
                        local: null,
                        codeFrameIndex: saveCodeFrame(path.node),
                    },
                ],
            });
        },
        ExportNamedDeclaration(path) {
            if (path.node.source) {
                imports.push({
                    source: path.node.source.value,
                    codeFrameIndex: saveCodeFrame(path.node.source),
                    specifiers: [],
                });
            }
        },
    });
    let isCJS = imports.length === 0 && exports.size === 0 && (sawModule || sawExports);
    let isAMD = imports.length === 0 && exports.size === 0 && sawDefine;
    return { imports, exports, isCJS, isAMD, problems, transpiledContent: code };
}
class CodeFrameStorage {
    constructor() {
        this.codeFrames = [];
        this.rawSources = [];
    }
    forSource(rawSource) {
        let rawSourceIndex;
        return (node) => {
            let loc = node.loc;
            if (!loc) {
                return;
            }
            if (rawSourceIndex == null) {
                rawSourceIndex = this.rawSources.length;
                this.rawSources.push(rawSource);
            }
            let codeFrameIndex = this.codeFrames.length;
            this.codeFrames.push({
                rawSourceIndex,
                loc,
            });
            return codeFrameIndex;
        };
    }
    render(codeFrameIndex) {
        if (codeFrameIndex != null) {
            let { loc, rawSourceIndex } = this.codeFrames[codeFrameIndex];
            return (0, code_frame_1.codeFrameColumns)(this.rawSources[rawSourceIndex], loc, { highlightCode: true });
        }
    }
}
exports.CodeFrameStorage = CodeFrameStorage;
function name(node) {
    if (core_1.types.isStringLiteral(node)) {
        return node.value;
    }
    else {
        return node.name;
    }
}
function isFreeVariable(path) {
    return !path.scope.hasBinding(path.node.name);
}
const contextCache = new WeakMap();
function inExportDeclarationContext(path) {
    if (contextCache.has(path.node)) {
        return contextCache.get(path.node);
    }
    else {
        let answer = _inExportDeclarationContext(path);
        contextCache.set(path.node, answer);
        return answer;
    }
}
function _inExportDeclarationContext(path) {
    let parent = path.parent;
    switch (parent.type) {
        case 'ExportNamedDeclaration':
            return parent.declaration === path.node;
        case 'VariableDeclaration':
        case 'ObjectPattern':
        case 'ArrayPattern':
        case 'RestElement':
            return inExportDeclarationContext(path.parentPath);
        case 'VariableDeclarator':
            return parent.id === path.node && inExportDeclarationContext(path.parentPath);
        case 'ObjectProperty':
            return parent.value === path.node && inExportDeclarationContext(path.parentPath);
        case 'AssignmentPattern':
            return parent.left === path.node && inExportDeclarationContext(path.parentPath);
        case 'FunctionDeclaration':
        case 'ClassDeclaration':
            return parent.id === path.node && inExportDeclarationContext(path.parentPath);
        default:
            return false;
    }
}
//# sourceMappingURL=babel-visitor.js.map