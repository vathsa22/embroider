"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = templateTagCodemod;
const default_pipeline_1 = __importDefault(require("./default-pipeline"));
const path_1 = require("path");
const fs_1 = require("fs");
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const core_1 = require("@babel/core");
const core_2 = require("@embroider/core");
const babel_import_util_1 = require("babel-import-util");
const resolver_transform_1 = __importDefault(require("./resolver-transform"));
const child_process_1 = require("child_process");
const core_3 = require("@embroider/core");
function templateTagCodemod(emberApp, { shouldTransformPath = (() => true), dryRun = false } = {}) {
    return new TemplateTagCodemodPlugin([
        (0, default_pipeline_1.default)(emberApp, undefined, {
            staticAddonTrees: true,
            staticAddonTestSupportTrees: true,
            staticComponents: true,
            staticHelpers: true,
            staticModifiers: true,
            staticEmberSource: true,
            amdCompatibility: {
                es: [],
            },
        }),
    ], { shouldTransformPath, dryRun });
}
class TemplateTagCodemodPlugin extends broccoli_plugin_1.default {
    constructor(inputNodes, options) {
        super(inputNodes, {
            name: 'TemplateTagCodemodPlugin',
        });
        this.options = options;
    }
    async build() {
        var _a, _b;
        function* walkSync(dir) {
            const files = (0, fs_1.readdirSync)(dir);
            for (const file of files) {
                const pathToFile = (0, path_1.join)(dir, file);
                const isDirectory = (0, fs_1.statSync)(pathToFile).isDirectory();
                if (isDirectory) {
                    yield* walkSync(pathToFile);
                }
                else {
                    yield pathToFile;
                }
            }
        }
        this.inputPaths[0];
        const tmp_path = (0, fs_1.readFileSync)(this.inputPaths[0] + '/.stage2-output').toLocaleString();
        const compatPattern = /#embroider_compat\/(?<type>[^\/]+)\/(?<rest>.*)/;
        const resolver = new core_2.ResolverLoader(process.cwd()).resolver;
        const hbs_file_test = /[\\/]rewritten-app[\\/]components[\\/].*\.hbs$/;
        // locate ember-source for the host app so we know which version to insert builtIns for
        const emberSourceEntrypoint = require.resolve('ember-source', { paths: [process.cwd()] });
        const emberVersion = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(emberSourceEntrypoint, '../../package.json')).toString()).version;
        for await (const current_file of walkSync(tmp_path)) {
            if (hbs_file_test.test(current_file) && this.options.shouldTransformPath(current_file)) {
                const template_file_src = (0, fs_1.readFileSync)(current_file).toLocaleString();
                const ember_template_compiler = resolver.nodeResolve('ember-source/vendor/ember/ember-template-compiler', (0, path_1.resolve)((0, core_3.locateEmbroiderWorkingDir)(process.cwd()), 'rewritten-app', 'package.json'));
                if (ember_template_compiler.type === 'not_found') {
                    throw 'This will not ever be true';
                }
                const embroider_compat_path = require.resolve('@embroider/compat', { paths: [process.cwd()] });
                const babel_plugin_ember_template_compilation = require.resolve('babel-plugin-ember-template-compilation', {
                    paths: [embroider_compat_path],
                });
                const babel_plugin_syntax_decorators = require.resolve('@babel/plugin-syntax-decorators', {
                    paths: [embroider_compat_path],
                });
                let src = (_b = (_a = (0, core_1.transformSync)((0, core_2.hbsToJS)(template_file_src), {
                    plugins: [
                        [
                            babel_plugin_ember_template_compilation,
                            {
                                compilerPath: ember_template_compiler.filename,
                                transforms: [(0, resolver_transform_1.default)({ appRoot: process.cwd(), emberVersion: emberVersion })],
                                targetFormat: 'hbs',
                            },
                        ],
                    ],
                })) === null || _a === void 0 ? void 0 : _a.code) !== null && _b !== void 0 ? _b : '';
                const import_bucket = [];
                let transformed_template_value = '';
                (0, core_1.transformSync)(src, {
                    plugins: [
                        function template_tag_extractor() {
                            return {
                                visitor: {
                                    ImportDeclaration(import_declaration) {
                                        const extractor = import_declaration.node.source.value.match(compatPattern);
                                        if (extractor) {
                                            const result = resolver.nodeResolve(extractor[0], current_file);
                                            if (result.type === 'real') {
                                                // find package
                                                const owner_package = resolver.packageCache.ownerOfFile(result.filename);
                                                // change import to real one
                                                import_declaration.node.source.value =
                                                    owner_package.name + '/' + extractor[1] + '/' + extractor[2];
                                                import_bucket.push(import_declaration);
                                            }
                                        }
                                        else if (import_declaration.node.source.value.indexOf('@ember/template-compilation') === -1) {
                                            import_bucket.push(import_declaration);
                                        }
                                    },
                                    CallExpression(path) {
                                        // reverse of hbs to js
                                        // extract the template string to put into template tag in backing class
                                        if ('name' in path.node.callee &&
                                            path.node.callee.name === 'precompileTemplate' &&
                                            path.node.arguments &&
                                            'value' in path.node.arguments[0]) {
                                            transformed_template_value = `<template>\n\t${path.node.arguments[0].value}\n</template>`;
                                        }
                                    },
                                },
                            };
                        },
                    ],
                });
                //find backing class
                const backing_class_resolution = resolver.nodeResolve('#embroider_compat/' + (0, path_1.relative)(tmp_path, current_file).replace(/[\\]/g, '/').slice(0, -4), tmp_path);
                const backing_class_filename = 'filename' in backing_class_resolution ? backing_class_resolution.filename : '';
                const backing_class_src = (0, fs_1.readFileSync)(backing_class_filename).toString();
                const magic_string = '__MAGIC_STRING_FOR_TEMPLATE_TAG_REPLACE__';
                const is_template_only = backing_class_src.indexOf("import templateOnlyComponent from '@ember/component/template-only';") !== -1;
                src = (0, core_1.transformSync)(backing_class_src, {
                    plugins: [
                        [babel_plugin_syntax_decorators, { decoratorsBeforeExport: true }],
                        function glimmer_syntax_creator(babel) {
                            return {
                                name: 'test',
                                visitor: {
                                    Program: {
                                        enter(path) {
                                            var _a;
                                            // Always instantiate the ImportUtil instance at the Program scope
                                            const importUtil = new babel_import_util_1.ImportUtil(babel.types, path);
                                            const first_node = path.get('body')[0];
                                            if (first_node &&
                                                first_node.node &&
                                                first_node.node.leadingComments &&
                                                ((_a = first_node.node.leadingComments[0]) === null || _a === void 0 ? void 0 : _a.value.includes('__COLOCATED_TEMPLATE__'))) {
                                                //remove magic comment
                                                first_node.node.leadingComments.splice(0, 1);
                                            }
                                            for (const template_import of import_bucket) {
                                                for (let i = 0, len = template_import.node.specifiers.length; i < len; ++i) {
                                                    const specifier = template_import.node.specifiers[i];
                                                    if (specifier.type === 'ImportDefaultSpecifier') {
                                                        importUtil.import(path, template_import.node.source.value, 'default', specifier.local.name);
                                                    }
                                                    else if (specifier.type === 'ImportSpecifier') {
                                                        importUtil.import(path, template_import.node.source.value, specifier.local.name);
                                                    }
                                                }
                                            }
                                        },
                                    },
                                    ImportDeclaration(import_declaration) {
                                        if (import_declaration.node.source.value.indexOf('@ember/component/template-only') !== -1) {
                                            import_declaration.remove();
                                        }
                                    },
                                    ExportDefaultDeclaration(path) {
                                        path.traverse({
                                            ClassBody(path) {
                                                const classbody_nodes = path.get('body');
                                                //add magic string to be replaces with the contents of the template tag
                                                classbody_nodes[classbody_nodes.length - 1].addComment('trailing', magic_string, false);
                                            },
                                        });
                                    },
                                },
                            };
                        },
                    ],
                }).code.replace(`/*${magic_string}*/`, transformed_template_value);
                if (is_template_only) {
                    // because we can't inject a comment as the default export
                    // we replace the known exported string
                    src = src.replace('templateOnlyComponent()', transformed_template_value);
                }
                const dryRun = this.options.dryRun ? '--dry-run' : '';
                // work out original file path in app tree
                const app_relative_path = (0, path_1.join)('app', (0, path_1.relative)(tmp_path, current_file));
                const new_file_path = app_relative_path.slice(0, -4) + '.gjs';
                // write glimmer file out
                if (this.options.dryRun) {
                    console.log('Write new file', new_file_path, src);
                }
                else {
                    (0, fs_1.writeFileSync)((0, path_1.join)(process.cwd(), new_file_path), src, { flag: 'wx+' });
                }
                // git rm old files (js/ts if exists + hbs)
                let rm_hbs = await execute(`git rm ${app_relative_path} ${dryRun}`, {
                    pwd: process.cwd(),
                });
                console.log(rm_hbs.output);
                if (!is_template_only) {
                    // remove backing class only if it's not a template only component
                    // resolve repative path to rewritten-app
                    const app_relative_path = (0, path_1.join)('app', (0, path_1.relative)(tmp_path, backing_class_filename));
                    let rm_js = await execute(`git rm ${app_relative_path} ${dryRun}`, {
                        pwd: process.cwd(),
                    });
                    console.log(rm_js.output);
                }
            }
        }
    }
}
async function execute(shellCommand, opts) {
    let env;
    if (opts === null || opts === void 0 ? void 0 : opts.env) {
        env = { ...process.env, ...opts.env };
    }
    let child = (0, child_process_1.spawn)(shellCommand, {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: opts === null || opts === void 0 ? void 0 : opts.pwd,
        shell: true,
        env,
    });
    let stderrBuffer = [];
    let stdoutBuffer = [];
    let combinedBuffer = [];
    child.stderr.on('data', data => {
        stderrBuffer.push(data);
        combinedBuffer.push(data);
    });
    child.stdout.on('data', data => {
        stdoutBuffer.push(data);
        combinedBuffer.push(data);
    });
    return new Promise(resolve => {
        child.on('close', (exitCode) => {
            resolve({
                exitCode,
                get stdout() {
                    return stdoutBuffer.join('');
                },
                get stderr() {
                    return stderrBuffer.join('');
                },
                get output() {
                    return combinedBuffer.join('');
                },
            });
        });
    });
}
//# sourceMappingURL=template-tag-codemod.js.map