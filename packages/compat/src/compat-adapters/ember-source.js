"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const add_to_tree_1 = __importDefault(require("../add-to-tree"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const typescript_memoize_1 = require("typescript-memoize");
const semver_1 = require("semver");
const core_1 = require("@babel/core");
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const fs_1 = require("fs");
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        return (0, broccoli_merge_trees_1.default)([super.v2Tree, (0, broccoli_funnel_1.default)(this.rootTree, { include: ['dist/ember-template-compiler.js'] })]);
    }
    get useStaticEmber() {
        return this.app.options.staticEmberSource;
    }
    // versions of ember-source prior to
    // https://github.com/emberjs/ember.js/pull/20675 ship dist/packages and
    // dist/dependencies separately and the imports between them are package-name
    // imports. Since many of the dependencies are also true package.json
    // dependencies (in order to get typescript types), and our module-resolver
    // prioritizes true dependencies, it's necessary to detect and remove the
    // package.json dependencies.
    //
    // After the above linked change, ember-source ships only dist/packages and
    // the inter-package imports are all relative. Some of the things in
    // dist/packages are still the rolled-in dependencies, but now that the
    // imports are all relative we need no special handling for them (beyond the
    // normal v2 addon renamed-modules support.
    get includedDependencies() {
        let result = [];
        let depsDir = (0, path_1.resolve)(this.root, 'dist', 'dependencies');
        if (!(0, fs_1.existsSync)(depsDir)) {
            return result;
        }
        for (let name of (0, fs_extra_1.readdirSync)(depsDir)) {
            if (name[0] === '@') {
                for (let innerName of (0, fs_extra_1.readdirSync)((0, path_1.resolve)(this.root, 'dist', 'dependencies', name))) {
                    if (innerName.endsWith('.js')) {
                        result.push(name + '/' + innerName.slice(0, -3));
                    }
                }
            }
            else {
                if (name.endsWith('.js')) {
                    result.push(name.slice(0, -3));
                }
            }
        }
        return result;
    }
    get newPackageJSON() {
        var _a;
        let json = super.newPackageJSON;
        if (this.useStaticEmber) {
            for (let name of this.includedDependencies) {
                // weirdly, many of the inlined dependency are still listed as real
                // dependencies too. If we don't delete them here, they will take
                // precedence over the inlined ones, because the embroider module-resolver
                // tries to prioritize real deps.
                (_a = json.dependencies) === null || _a === void 0 ? true : delete _a[name];
            }
        }
        return json;
    }
    customizes(treeName) {
        if (this.useStaticEmber) {
            // we are adding custom implementations of these
            return treeName === 'treeForAddon' || treeName === 'treeForVendor' || super.customizes(treeName);
        }
        else {
            return super.customizes(treeName);
        }
    }
    invokeOriginalTreeFor(name, opts = { neuterPreprocessors: false }) {
        if (this.useStaticEmber) {
            if (name === 'addon') {
                return this.customAddonTree();
            }
            if (name === 'vendor') {
                return this.customVendorTree();
            }
        }
        return super.invokeOriginalTreeFor(name, opts);
    }
    // Our addon tree is all of the "packages" we share. @embroider/compat already
    // supports that pattern of emitting modules into other package's namespaces.
    customAddonTree() {
        let packages = (0, broccoli_funnel_1.default)(this.rootTree, {
            srcDir: 'dist/packages',
        });
        let trees = [
            packages,
            (0, broccoli_funnel_1.default)(this.rootTree, {
                srcDir: 'dist/dependencies',
                allowEmpty: true,
            }),
        ];
        if ((0, semver_1.satisfies)(this.packageJSON.version, '>= 4.0.0-alpha.0 <4.10.0-alpha.0', { includePrerelease: true })) {
            // import { loc } from '@ember/string' was removed in 4.0. but the
            // top-level `ember` package tries to import it until 4.10. A
            // spec-compliant ES modules implementation will treat this as a parse
            // error.
            trees.push(new FixStringLoc([packages]));
        }
        return (0, broccoli_merge_trees_1.default)(trees, { overwrite: true });
    }
    // We're zeroing out these files in vendor rather than deleting them, because
    // we can't easily intercept the `app.import` that presumably exists for them,
    // so rather than error they will just be empty.
    //
    // The reason we're zeroing these out is that we're going to consume all our
    // modules directly out of treeForAddon instead, as real modules that webpack
    // can see.
    customVendorTree() {
        return new add_to_tree_1.default(this.addonInstance._treeFor('vendor'), outputPath => {
            (0, fs_extra_1.unlinkSync)((0, path_1.join)(outputPath, 'ember', 'ember.js'));
            (0, fs_extra_1.outputFileSync)((0, path_1.join)(outputPath, 'ember', 'ember.js'), '');
            (0, fs_extra_1.unlinkSync)((0, path_1.join)(outputPath, 'ember', 'ember-testing.js'));
            (0, fs_extra_1.outputFileSync)((0, path_1.join)(outputPath, 'ember', 'ember-testing.js'), '');
        });
    }
    get packageMeta() {
        let meta = super.packageMeta;
        if (this.useStaticEmber) {
            if (!meta['implicit-modules']) {
                meta['implicit-modules'] = [];
            }
            meta['implicit-modules'].push('./ember/index.js');
            // before 5.6, Ember uses the AMD loader to decide if it's test-only parts
            // are present, so we must ensure they're registered. After that it's
            // enough to evaluate ember-testing, which @embroider/core is hard-coded
            // to do in the backward-compatible tests bundle.
            if (!(0, semver_1.satisfies)(this.packageJSON.version, '>= 5.6.0-alpha.0', { includePrerelease: true })) {
                if (!meta['implicit-test-modules']) {
                    meta['implicit-test-modules'] = [];
                }
                meta['implicit-test-modules'].push('./ember-testing/index.js');
            }
        }
        return meta;
    }
}
exports.default = default_1;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], default_1.prototype, "includedDependencies", null);
class FixStringLoc extends broccoli_plugin_1.default {
    build() {
        let inSource = (0, fs_extra_1.readFileSync)((0, path_1.resolve)(this.inputPaths[0], 'ember', 'index.js'), 'utf8');
        let outSource = (0, core_1.transform)(inSource, {
            plugins: [fixStringLoc],
            configFile: false,
        }).code;
        (0, fs_extra_1.outputFileSync)((0, path_1.resolve)(this.outputPath, 'ember', 'index.js'), outSource, 'utf8');
    }
}
function fixStringLoc(babel) {
    let t = babel.types;
    return {
        visitor: {
            Program(path) {
                path.node.body.unshift(t.variableDeclaration('const', [t.variableDeclarator(t.identifier('loc'), t.identifier('undefined'))]));
            },
            ImportDeclaration: {
                enter(path, state) {
                    if (path.node.source.value === '@ember/string') {
                        state.inEmberString = true;
                    }
                },
                exit(_path, state) {
                    state.inEmberString = false;
                },
            },
            ImportSpecifier(path, state) {
                let name = 'value' in path.node.imported ? path.node.imported.value : path.node.imported.name;
                if (state.inEmberString && name === 'loc') {
                    path.remove();
                }
            },
        },
    };
}
//# sourceMappingURL=ember-source.js.map