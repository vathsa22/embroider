"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompatAppBuilder = void 0;
const core_1 = require("@embroider/core");
const walk_sync_1 = __importDefault(require("walk-sync"));
const path_1 = require("path");
const dependency_rules_1 = require("./dependency-rules");
const flatMap_1 = __importDefault(require("lodash/flatMap"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const flatten_1 = __importDefault(require("lodash/flatten"));
const partition_1 = __importDefault(require("lodash/partition"));
const mergeWith_1 = __importDefault(require("lodash/mergeWith"));
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const resolve_1 = require("resolve");
const bind_decorator_1 = __importDefault(require("bind-decorator"));
const fs_extra_1 = require("fs-extra");
const ember_html_1 = require("@embroider/core/src/ember-html");
const portable_babel_config_1 = require("@embroider/core/src/portable-babel-config");
const app_files_1 = require("@embroider/core/src/app-files");
const portable_1 = require("@embroider/core/src/portable");
const assert_never_1 = __importDefault(require("assert-never"));
const typescript_memoize_1 = require("typescript-memoize");
const path_2 = require("path");
const resolve_2 = __importDefault(require("resolve"));
const fs_extra_2 = require("fs-extra");
const node_1 = require("@embroider/macros/src/node");
const fast_sourcemap_concat_1 = __importDefault(require("fast-sourcemap-concat"));
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const sync_dir_1 = require("./sync-dir");
// This exists during the actual broccoli build step. As opposed to CompatApp,
// which also exists during pipeline-construction time.
class CompatAppBuilder {
    constructor(root, origAppPackage, appPackageWithMovedDeps, options, compatApp, configTree, synthVendor, synthStyles) {
        this.root = root;
        this.origAppPackage = origAppPackage;
        this.appPackageWithMovedDeps = appPackageWithMovedDeps;
        this.options = options;
        this.compatApp = compatApp;
        this.configTree = configTree;
        this.synthVendor = synthVendor;
        this.synthStyles = synthStyles;
        // for each relativePath, an Asset we have already emitted
        this.assets = new Map();
        this.firstBuild = true;
    }
    fastbootJSSrcDir() {
        let target = (0, path_2.join)(this.compatApp.root, 'fastboot');
        if ((0, fs_extra_2.pathExistsSync)(target)) {
            return target;
        }
    }
    extractAssets(treePaths) {
        let assets = [];
        // Everything in our traditional public tree is an on-disk asset
        if (treePaths.publicTree) {
            walk_sync_1.default
                .entries(treePaths.publicTree, {
                directories: false,
            })
                .forEach(entry => {
                assets.push({
                    kind: 'on-disk',
                    relativePath: entry.relativePath,
                    sourcePath: entry.fullPath,
                    mtime: entry.mtime, // https://github.com/joliss/node-walk-sync/pull/38
                    size: entry.size,
                });
            });
        }
        // ember-cli traditionally outputs a dummy testem.js file to prevent
        // spurious errors when running tests under "ember s".
        if (this.compatApp.shouldBuildTests) {
            let testemAsset = this.findTestemAsset();
            if (testemAsset) {
                assets.push(testemAsset);
            }
        }
        for (let asset of this.emberEntrypoints(treePaths.htmlTree)) {
            assets.push(asset);
        }
        return assets;
    }
    findTestemAsset() {
        let sourcePath;
        try {
            sourcePath = (0, resolve_1.sync)('ember-cli/lib/broccoli/testem.js', { basedir: this.root });
        }
        catch (err) { }
        if (sourcePath) {
            let stat = (0, fs_extra_1.statSync)(sourcePath);
            return {
                kind: 'on-disk',
                relativePath: 'testem.js',
                sourcePath,
                mtime: stat.mtime.getTime(),
                size: stat.size,
            };
        }
    }
    activeAddonChildren(pkg) {
        let result = pkg.dependencies.filter(this.isActiveAddon).filter(
        // When looking for child addons, we want to ignore 'peerDependencies' of
        // a given package, to align with how ember-cli resolves addons. So here
        // we only include dependencies that are definitely active due to one of
        // the other sections.
        addon => pkg.categorizeDependency(addon.name) !== 'peerDependencies');
        if (pkg === this.appPackageWithMovedDeps) {
            let extras = [this.synthVendor, this.synthStyles].filter(this.isActiveAddon);
            result = [...result, ...extras];
        }
        return result.sort(this.orderAddons);
    }
    get allActiveAddons() {
        let result = this.appPackageWithMovedDeps.findDescendants(this.isActiveAddon);
        let extras = [this.synthVendor, this.synthStyles].filter(this.isActiveAddon);
        let extraDescendants = (0, flatMap_1.default)(extras, dep => dep.findDescendants(this.isActiveAddon));
        result = [...result, ...extras, ...extraDescendants];
        return result.sort(this.orderAddons);
    }
    isActiveAddon(pkg) {
        // stage1 already took care of converting everything that's actually active
        // into v2 addons. If it's not a v2 addon, we don't want it.
        //
        // We can encounter v1 addons here when there is inactive stuff floating
        // around in the node_modules that accidentally satisfy something like an
        // optional peer dep.
        return pkg.isV2Addon();
    }
    orderAddons(depA, depB) {
        let depAIdx = 0;
        let depBIdx = 0;
        if (depA && depA.meta && depA.isV2Addon()) {
            depAIdx = depA.meta['order-index'] || 0;
        }
        if (depB && depB.meta && depB.isV2Addon()) {
            depBIdx = depB.meta['order-index'] || 0;
        }
        return depAIdx - depBIdx;
    }
    resolvableExtensions() {
        // webpack's default is ['.wasm', '.mjs', '.js', '.json']. Keeping that
        // subset in that order is sensible, since many third-party libraries will
        // expect it to work that way.
        //
        // For TS, we defer to ember-cli-babel, and the setting for
        // "enableTypescriptTransform" can be set with and without
        // ember-cli-typescript
        return ['.wasm', '.mjs', '.js', '.json', '.ts', '.hbs', '.hbs.js'];
    }
    *emberEntrypoints(htmlTreePath) {
        let classicEntrypoints = [
            { entrypoint: 'index.html', includeTests: false },
            { entrypoint: 'tests/index.html', includeTests: true },
        ];
        if (!this.compatApp.shouldBuildTests) {
            classicEntrypoints.pop();
        }
        for (let { entrypoint, includeTests } of classicEntrypoints) {
            let sourcePath = (0, path_2.join)(htmlTreePath, entrypoint);
            let stats = (0, fs_extra_1.statSync)(sourcePath);
            let asset = {
                kind: 'ember',
                relativePath: entrypoint,
                includeTests,
                sourcePath,
                mtime: stats.mtime.getTime(),
                size: stats.size,
                rootURL: this.rootURL(),
                prepare: (dom) => {
                    let scripts = [...dom.window.document.querySelectorAll('script')];
                    let styles = [...dom.window.document.querySelectorAll('link[rel*="stylesheet"]')];
                    return {
                        javascript: this.compatApp.findAppScript(scripts, entrypoint),
                        styles: this.compatApp.findAppStyles(styles, entrypoint),
                        implicitScripts: this.compatApp.findVendorScript(scripts, entrypoint),
                        implicitStyles: this.compatApp.findVendorStyles(styles, entrypoint),
                        testJavascript: this.compatApp.findTestScript(scripts),
                        implicitTestScripts: this.compatApp.findTestSupportScript(scripts),
                        implicitTestStyles: this.compatApp.findTestSupportStyles(styles),
                    };
                },
            };
            yield asset;
        }
    }
    modulePrefix() {
        return this.configTree.readConfig().modulePrefix;
    }
    podModulePrefix() {
        return this.configTree.readConfig().podModulePrefix;
    }
    rootURL() {
        return this.configTree.readConfig().rootURL;
    }
    activeRules() {
        return (0, dependency_rules_1.activePackageRules)(this.options.packageRules.concat(defaultAddonPackageRules()), [
            { name: this.origAppPackage.name, version: this.origAppPackage.version, root: this.root },
            ...this.allActiveAddons.filter(p => p.meta['auto-upgraded']),
        ]);
    }
    resolverConfig(engines) {
        let renamePackages = Object.assign({}, ...this.allActiveAddons.map(dep => dep.meta['renamed-packages']));
        let renameModules = Object.assign({}, ...this.allActiveAddons.map(dep => dep.meta['renamed-modules']));
        let activeAddons = {};
        for (let addon of this.allActiveAddons) {
            activeAddons[addon.name] = addon.root;
        }
        let options = {
            staticHelpers: this.options.staticHelpers,
            staticModifiers: this.options.staticModifiers,
            staticComponents: this.options.staticComponents,
            allowUnsafeDynamicComponents: this.options.allowUnsafeDynamicComponents,
        };
        let config = {
            // this part is the base ModuleResolverOptions as required by @embroider/core
            activeAddons,
            renameModules,
            renamePackages,
            resolvableExtensions: this.resolvableExtensions(),
            appRoot: this.origAppPackage.root,
            engines: engines.map((appFiles, index) => ({
                packageName: appFiles.engine.package.name,
                // first engine is the app, which has been relocated to this.root
                // we need to use the real path here because webpack requests always use the real path i.e. follow symlinks
                root: (0, fs_extra_1.realpathSync)(index === 0 ? this.root : appFiles.engine.package.root),
                fastbootFiles: appFiles.fastbootFiles,
                activeAddons: [...appFiles.engine.addons]
                    .map(a => ({
                    name: a.name,
                    root: a.root,
                }))
                    // the traditional order is the order in which addons will run, such
                    // that the last one wins. Our resolver's order is the order to
                    // search, so first one wins.
                    .reverse(),
            })),
            amdCompatibility: this.options.amdCompatibility,
            // this is the additional stufff that @embroider/compat adds on top to do
            // global template resolving
            modulePrefix: this.modulePrefix(),
            podModulePrefix: this.podModulePrefix(),
            activePackageRules: this.activeRules(),
            options,
        };
        return config;
    }
    scriptPriority(pkg) {
        switch (pkg.name) {
            case 'loader.js':
                return 0;
            case 'ember-source':
                return 10;
            default:
                return 1000;
        }
    }
    get resolvableExtensionsPattern() {
        return (0, core_1.extensionsPattern)(this.resolvableExtensions());
    }
    impliedAssets(type, engine, emberENV) {
        let result = this.impliedAddonAssets(type, engine).map((sourcePath) => {
            let stats = (0, fs_extra_1.statSync)(sourcePath);
            return {
                kind: 'on-disk',
                relativePath: (0, core_1.explicitRelative)(this.root, sourcePath),
                sourcePath,
                mtime: stats.mtimeMs,
                size: stats.size,
            };
        });
        if (type === 'implicit-scripts') {
            result.unshift({
                kind: 'in-memory',
                relativePath: '_testing_prefix_.js',
                source: `var runningTests=false;`,
            });
            result.unshift({
                kind: 'in-memory',
                relativePath: '_ember_env_.js',
                source: `window.EmberENV={ ...(window.EmberENV || {}), ...${JSON.stringify(emberENV, null, 2)} };`,
            });
            result.push({
                kind: 'in-memory',
                relativePath: '_loader_.js',
                source: `loader.makeDefaultExport=false;`,
            });
        }
        if (type === 'implicit-test-scripts') {
            // this is the traditional test-support-suffix.js
            result.push({
                kind: 'in-memory',
                relativePath: '_testing_suffix_.js',
                source: `
        var runningTests=true;
        if (typeof Testem !== 'undefined' && (typeof QUnit !== 'undefined' || typeof Mocha !== 'undefined')) {
          Testem.hookIntoTestFramework();
        }`,
            });
            // whether or not anybody was actually using @embroider/macros
            // explicitly as an addon, we ensure its test-support file is always
            // present.
            if (!result.find(s => s.kind === 'on-disk' && s.sourcePath.endsWith('embroider-macros-test-support.js'))) {
                result.unshift({
                    kind: 'on-disk',
                    sourcePath: require.resolve('@embroider/macros/src/vendor/embroider-macros-test-support'),
                    mtime: 0,
                    size: 0,
                    relativePath: 'embroider-macros-test-support.js',
                });
            }
        }
        return result;
    }
    impliedAddonAssets(type, { engine }) {
        let result = [];
        for (let addon of (0, sortBy_1.default)(Array.from(engine.addons), this.scriptPriority.bind(this))) {
            let implicitScripts = addon.meta[type];
            if (implicitScripts) {
                let styles = [];
                let options = { basedir: addon.root };
                for (let mod of implicitScripts) {
                    if (type === 'implicit-styles') {
                        // exclude engines because they will handle their own css importation
                        if (!addon.isLazyEngine()) {
                            styles.push(resolve_2.default.sync(mod, options));
                        }
                    }
                    else {
                        result.push(resolve_2.default.sync(mod, options));
                    }
                }
                if (styles.length) {
                    result = [...styles, ...result];
                }
            }
        }
        return result;
    }
    babelConfig(resolverConfig) {
        let babel = (0, cloneDeep_1.default)(this.compatApp.babelConfig());
        if (!babel.plugins) {
            babel.plugins = [];
        }
        // Our stage3 code is always allowed to use dynamic import. We may emit it
        // ourself when splitting routes.
        babel.plugins.push(require.resolve('@babel/plugin-syntax-dynamic-import'));
        // https://github.com/webpack/webpack/issues/12154
        babel.plugins.push(require.resolve('./rename-require-plugin'));
        babel.plugins.push([require.resolve('babel-plugin-ember-template-compilation'), this.etcOptions(resolverConfig)]);
        // this is @embroider/macros configured for full stage3 resolution
        babel.plugins.push(...this.compatApp.macrosConfig.babelPluginConfig());
        let colocationOptions = {
            appRoot: this.origAppPackage.root,
            // This extra weirdness is a compromise in favor of build performance.
            //
            // 1. When auto-upgrading an addon from v1 to v2, we definitely want to
            //    run any custom AST transforms in stage1.
            //
            // 2. In general case, AST transforms are allowed to manipulate Javascript
            //    scope. This means that running transforms -- even when we're doing
            //    source-to-source compilation that emits handlebars and not wire
            //    format -- implies changing .hbs files into .js files.
            //
            // 3. So stage1 may need to rewrite .hbs to .hbs.js (to avoid colliding
            //    with an existing co-located .js file).
            //
            // 4. But stage1 doesn't necessarily want to run babel over the
            //    corresponding JS file. Most of the time, that's just an
            //    unnecessarily expensive second parse. (We only run it in stage1 to
            //    eliminate an addon's custom babel plugins, and many addons don't
            //    have any.)
            //
            // 5. Therefore, the work of template-colocation gets defered until here,
            //    and it may see co-located templates named `.hbs.js` instead of the
            //    usual `.hbs.
            templateExtensions: ['.hbs', '.hbs.js'],
            // All of the above only applies to auto-upgraded packages that were
            // authored in v1. V2 packages don't get any of this complexity, they're
            // supposed to take care of colocating their own templates explicitly.
            packageGuard: true,
        };
        babel.plugins.push([core_1.templateColocationPluginPath, colocationOptions]);
        babel.plugins.push([
            require.resolve('./babel-plugin-adjust-imports'),
            (() => {
                let pluginConfig = {
                    appRoot: resolverConfig.appRoot,
                };
                return pluginConfig;
            })(),
        ]);
        // we can use globally shared babel runtime by default
        babel.plugins.push([
            require.resolve('@babel/plugin-transform-runtime'),
            { absoluteRuntime: __dirname, useESModules: true, regenerator: false },
        ]);
        const portable = (0, portable_babel_config_1.makePortable)(babel, { basedir: this.root }, this.portableHints);
        addCachablePlugin(portable.config);
        return portable;
    }
    insertEmberApp(asset, appFiles, prepared, emberENV) {
        let html = asset.html;
        if (this.fastbootConfig) {
            // ignore scripts like ember-cli-livereload.js which are not really associated with
            // "the app".
            let ignoreScripts = html.dom.window.document.querySelectorAll('script');
            ignoreScripts.forEach(script => {
                script.setAttribute('data-fastboot-ignore', '');
            });
        }
        // our tests entrypoint already includes a correct module dependency on the
        // app, so we only insert the app when we're not inserting tests
        if (!asset.fileAsset.includeTests) {
            let appJS = this.topAppJSAsset(appFiles, prepared);
            html.insertScriptTag(html.javascript, appJS.relativePath, { type: 'module' });
        }
        if (this.fastbootConfig) {
            // any extra fastboot app files get inserted into our html.javascript
            // section, after the app has been inserted.
            for (let script of this.fastbootConfig.extraAppFiles) {
                html.insertScriptTag(html.javascript, script, { tag: 'fastboot-script' });
            }
        }
        html.insertStyleLink(html.styles, `assets/${this.origAppPackage.name}.css`);
        const parentEngine = appFiles.find(e => !e.engine.parent);
        let vendorJS = this.implicitScriptsAsset(prepared, parentEngine, emberENV);
        if (vendorJS) {
            html.insertScriptTag(html.implicitScripts, vendorJS.relativePath);
        }
        if (this.fastbootConfig) {
            // any extra fastboot vendor files get inserted into our
            // html.implicitScripts section, after the regular implicit script
            // (vendor.js) have been inserted.
            for (let script of this.fastbootConfig.extraVendorFiles) {
                html.insertScriptTag(html.implicitScripts, script, { tag: 'fastboot-script' });
            }
        }
        let implicitStyles = this.implicitStylesAsset(prepared, parentEngine);
        if (implicitStyles) {
            html.insertStyleLink(html.implicitStyles, implicitStyles.relativePath);
        }
        if (!asset.fileAsset.includeTests) {
            return;
        }
        // Test-related assets happen below this point
        let testJS = this.testJSEntrypoint(appFiles, prepared);
        html.insertScriptTag(html.testJavascript, testJS.relativePath, { type: 'module' });
        let implicitTestScriptsAsset = this.implicitTestScriptsAsset(prepared, parentEngine);
        if (implicitTestScriptsAsset) {
            html.insertScriptTag(html.implicitTestScripts, implicitTestScriptsAsset.relativePath);
        }
        let implicitTestStylesAsset = this.implicitTestStylesAsset(prepared, parentEngine);
        if (implicitTestStylesAsset) {
            html.insertStyleLink(html.implicitTestStyles, implicitTestStylesAsset.relativePath);
        }
    }
    implicitScriptsAsset(prepared, application, emberENV) {
        let asset = prepared.get('assets/vendor.js');
        if (!asset) {
            let implicitScripts = this.impliedAssets('implicit-scripts', application, emberENV);
            if (implicitScripts.length > 0) {
                asset = new ConcatenatedAsset('assets/vendor.js', implicitScripts, this.resolvableExtensionsPattern);
                prepared.set(asset.relativePath, asset);
            }
        }
        return asset;
    }
    implicitStylesAsset(prepared, application) {
        let asset = prepared.get('assets/vendor.css');
        if (!asset) {
            let implicitStyles = this.impliedAssets('implicit-styles', application);
            if (implicitStyles.length > 0) {
                // we reverse because we want the synthetic vendor style at the top
                asset = new ConcatenatedAsset('assets/vendor.css', implicitStyles.reverse(), this.resolvableExtensionsPattern);
                prepared.set(asset.relativePath, asset);
            }
        }
        return asset;
    }
    implicitTestScriptsAsset(prepared, application) {
        let testSupportJS = prepared.get('assets/test-support.js');
        if (!testSupportJS) {
            let implicitTestScripts = this.impliedAssets('implicit-test-scripts', application);
            if (implicitTestScripts.length > 0) {
                testSupportJS = new ConcatenatedAsset('assets/test-support.js', implicitTestScripts, this.resolvableExtensionsPattern);
                prepared.set(testSupportJS.relativePath, testSupportJS);
            }
        }
        return testSupportJS;
    }
    implicitTestStylesAsset(prepared, application) {
        let asset = prepared.get('assets/test-support.css');
        if (!asset) {
            let implicitTestStyles = this.impliedAssets('implicit-test-styles', application);
            if (implicitTestStyles.length > 0) {
                asset = new ConcatenatedAsset('assets/test-support.css', implicitTestStyles, this.resolvableExtensionsPattern);
                prepared.set(asset.relativePath, asset);
            }
        }
        return asset;
    }
    // recurse to find all active addons that don't cross an engine boundary.
    // Inner engines themselves will be returned, but not those engines' children.
    // The output set's insertion order is the proper ember-cli compatible
    // ordering of the addons.
    findActiveAddons(pkg, engine, isChild = false) {
        for (let child of this.activeAddonChildren(pkg)) {
            if (!child.isEngine()) {
                this.findActiveAddons(child, engine, true);
            }
            engine.addons.add(child);
        }
        // ensure addons are applied in the correct order, if set (via @embroider/compat/v1-addon)
        if (!isChild) {
            engine.addons = new Set([...engine.addons].sort((a, b) => {
                return (a.meta['order-index'] || 0) - (b.meta['order-index'] || 0);
            }));
        }
    }
    partitionEngines(appJSPath) {
        let queue = [
            {
                package: this.appPackageWithMovedDeps,
                addons: new Set(),
                parent: undefined,
                sourcePath: appJSPath,
                modulePrefix: this.modulePrefix(),
                appRelativePath: '.',
            },
        ];
        let done = [];
        let seenEngines = new Set();
        while (true) {
            let current = queue.shift();
            if (!current) {
                break;
            }
            this.findActiveAddons(current.package, current);
            for (let addon of current.addons) {
                if (addon.isEngine() && !seenEngines.has(addon)) {
                    seenEngines.add(addon);
                    queue.push({
                        package: addon,
                        addons: new Set(),
                        parent: current,
                        sourcePath: addon.root,
                        modulePrefix: addon.name,
                        appRelativePath: (0, core_1.explicitRelative)(this.root, addon.root),
                    });
                }
            }
            done.push(current);
        }
        return done;
    }
    get activeFastboot() {
        return this.activeAddonChildren(this.appPackageWithMovedDeps).find(a => a.name === 'ember-cli-fastboot');
    }
    emberVersion() {
        let pkg = this.activeAddonChildren(this.appPackageWithMovedDeps).find(a => a.name === 'ember-source');
        if (!pkg) {
            throw new Error('no ember version!');
        }
        return pkg.version;
    }
    get fastbootConfig() {
        if (this.activeFastboot) {
            // this is relying on work done in stage1 by @embroider/compat/src/compat-adapters/ember-cli-fastboot.ts
            let packageJSON = (0, fs_extra_1.readJSONSync)((0, path_2.join)(this.activeFastboot.root, '_fastboot_', 'package.json'));
            let { extraAppFiles, extraVendorFiles } = packageJSON['embroider-fastboot'];
            delete packageJSON['embroider-fastboot'];
            extraVendorFiles.push('assets/embroider_macros_fastboot_init.js');
            return { packageJSON, extraAppFiles, extraVendorFiles };
        }
    }
    updateAppJS(appJSPath) {
        var _a;
        if (!this.engines) {
            this.engines = this.partitionEngines(appJSPath).map(engine => {
                if (engine.sourcePath === appJSPath) {
                    // this is the app. We have more to do for the app than for other
                    // engines.
                    let fastbootSync;
                    if (this.activeFastboot) {
                        let fastbootDir = this.fastbootJSSrcDir();
                        if (fastbootDir) {
                            fastbootSync = new sync_dir_1.SyncDir(fastbootDir, (0, path_1.resolve)(this.root, '_fastboot_'));
                        }
                    }
                    return {
                        engine,
                        appSync: new sync_dir_1.SyncDir(appJSPath, this.root),
                        fastbootSync,
                    };
                }
                else {
                    // this is not the app, so it's some other engine. Engines are already
                    // built by stage1 like all other addons, so we only need to observe
                    // their files, not doing any actual copying or building.
                    return {
                        engine,
                        appSync: new sync_dir_1.SyncDir(engine.sourcePath, undefined),
                        // AFAIK, we've never supported a fastboot overlay directory in an
                        // engine. But if we do need that, it would go here.
                        fastbootSync: undefined,
                    };
                }
            });
        }
        for (let engine of this.engines) {
            engine.appSync.update();
            (_a = engine.fastbootSync) === null || _a === void 0 ? void 0 : _a.update();
        }
        return this.engines.map(({ engine, appSync, fastbootSync }) => {
            var _a;
            return new app_files_1.AppFiles(engine, appSync.files, (_a = fastbootSync === null || fastbootSync === void 0 ? void 0 : fastbootSync.files) !== null && _a !== void 0 ? _a : new Set(), this.resolvableExtensionsPattern, this.podModulePrefix());
        });
    }
    prepareAsset(asset, appFiles, prepared, emberENV) {
        if (asset.kind === 'ember') {
            let prior = this.assets.get(asset.relativePath);
            let parsed;
            if (prior && prior.kind === 'built-ember' && prior.parsedAsset.validFor(asset)) {
                // we can reuse the parsed html
                parsed = prior.parsedAsset;
                parsed.html.clear();
            }
            else {
                parsed = new ParsedEmberAsset(asset);
            }
            this.insertEmberApp(parsed, appFiles, prepared, emberENV);
            prepared.set(asset.relativePath, new BuiltEmberAsset(parsed));
        }
        else {
            prepared.set(asset.relativePath, asset);
        }
    }
    prepareAssets(requestedAssets, appFiles, emberENV) {
        let prepared = new Map();
        for (let asset of requestedAssets) {
            this.prepareAsset(asset, appFiles, prepared, emberENV);
        }
        return prepared;
    }
    assetIsValid(asset, prior) {
        if (!prior) {
            return false;
        }
        switch (asset.kind) {
            case 'on-disk':
                return prior.kind === 'on-disk' && prior.size === asset.size && prior.mtime === asset.mtime;
            case 'in-memory':
                return prior.kind === 'in-memory' && stringOrBufferEqual(prior.source, asset.source);
            case 'built-ember':
                return prior.kind === 'built-ember' && prior.source === asset.source;
            case 'concatenated-asset':
                return (prior.kind === 'concatenated-asset' &&
                    prior.sources.length === asset.sources.length &&
                    prior.sources.every((priorFile, index) => {
                        let newFile = asset.sources[index];
                        return this.assetIsValid(newFile, priorFile);
                    }));
        }
    }
    updateOnDiskAsset(asset) {
        let destination = (0, path_2.join)(this.root, asset.relativePath);
        (0, fs_extra_2.ensureDirSync)((0, path_2.dirname)(destination));
        (0, fs_extra_2.copySync)(asset.sourcePath, destination, { dereference: true });
    }
    updateInMemoryAsset(asset) {
        let destination = (0, path_2.join)(this.root, asset.relativePath);
        (0, fs_extra_2.ensureDirSync)((0, path_2.dirname)(destination));
        (0, fs_extra_1.writeFileSync)(destination, asset.source, 'utf8');
    }
    updateBuiltEmberAsset(asset) {
        let destination = (0, path_2.join)(this.root, asset.relativePath);
        (0, fs_extra_2.ensureDirSync)((0, path_2.dirname)(destination));
        (0, fs_extra_1.writeFileSync)(destination, asset.source, 'utf8');
    }
    async updateConcatenatedAsset(asset) {
        let concat = new fast_sourcemap_concat_1.default({
            outputFile: (0, path_2.join)(this.root, asset.relativePath),
            mapCommentType: asset.relativePath.endsWith('.js') ? 'line' : 'block',
            baseDir: this.root,
        });
        if (process.env.EMBROIDER_CONCAT_STATS) {
            let MeasureConcat = (await Promise.resolve().then(() => __importStar(require('@embroider/core/src/measure-concat')))).default;
            concat = new MeasureConcat(asset.relativePath, concat, this.root);
        }
        for (let source of asset.sources) {
            switch (source.kind) {
                case 'on-disk':
                    concat.addFile((0, core_1.explicitRelative)(this.root, source.sourcePath));
                    break;
                case 'in-memory':
                    if (typeof source.source !== 'string') {
                        throw new Error(`attempted to concatenated a Buffer-backed in-memory asset`);
                    }
                    concat.addSpace(source.source);
                    break;
                default:
                    (0, assert_never_1.default)(source);
            }
        }
        await concat.end();
    }
    async updateAssets(requestedAssets, appFiles, emberENV) {
        let assets = this.prepareAssets(requestedAssets, appFiles, emberENV);
        for (let asset of assets.values()) {
            if (this.assetIsValid(asset, this.assets.get(asset.relativePath))) {
                continue;
            }
            (0, core_1.debug)('rebuilding %s', asset.relativePath);
            switch (asset.kind) {
                case 'on-disk':
                    this.updateOnDiskAsset(asset);
                    break;
                case 'in-memory':
                    this.updateInMemoryAsset(asset);
                    break;
                case 'built-ember':
                    this.updateBuiltEmberAsset(asset);
                    break;
                case 'concatenated-asset':
                    await this.updateConcatenatedAsset(asset);
                    break;
                default:
                    (0, assert_never_1.default)(asset);
            }
        }
        for (let oldAsset of this.assets.values()) {
            if (!assets.has(oldAsset.relativePath)) {
                (0, fs_extra_1.unlinkSync)((0, path_2.join)(this.root, oldAsset.relativePath));
            }
        }
        this.assets = assets;
        return [...assets.values()];
    }
    gatherAssets(inputPaths) {
        // first gather all the assets out of addons
        let assets = [];
        for (let pkg of this.allActiveAddons) {
            if (pkg.meta['public-assets']) {
                for (let [filename, appRelativeURL] of Object.entries(pkg.meta['public-assets'] || {})) {
                    let sourcePath = (0, path_1.resolve)(pkg.root, filename);
                    let stats = (0, fs_extra_1.statSync)(sourcePath);
                    assets.push({
                        kind: 'on-disk',
                        sourcePath,
                        relativePath: appRelativeURL,
                        mtime: stats.mtimeMs,
                        size: stats.size,
                    });
                }
            }
        }
        if (this.activeFastboot) {
            const source = `
      (function(){
        var key = '_embroider_macros_runtime_config';
        if (!window[key]){ window[key] = [];}
        window[key].push(function(m) {
          m.setGlobalConfig('fastboot', Object.assign({}, m.getGlobalConfig().fastboot, { isRunning: true }));
        });
      }())`;
            assets.push({
                kind: 'in-memory',
                source,
                relativePath: 'assets/embroider_macros_fastboot_init.js',
            });
        }
        // and finally tack on the ones from our app itself
        return assets.concat(this.extractAssets(inputPaths));
    }
    async build(inputPaths) {
        // on the first build, we lock down the macros config. on subsequent builds,
        // this doesn't do anything anyway because it's idempotent.
        this.compatApp.macrosConfig.finalize();
        // on first build, clear the output directory completely
        if (this.firstBuild) {
            (0, fs_extra_1.rmSync)(this.root, { recursive: true, force: true });
            this.firstBuild = false;
        }
        let appFiles = this.updateAppJS(inputPaths.appJS);
        let emberENV = this.configTree.readConfig().EmberENV;
        let assets = this.gatherAssets(inputPaths);
        let finalAssets = await this.updateAssets(assets, appFiles, emberENV);
        let assetPaths = assets.map(asset => asset.relativePath);
        if (this.activeFastboot) {
            // when using fastboot, our own package.json needs to be in the output so fastboot can read it.
            assetPaths.push('package.json');
        }
        for (let asset of finalAssets) {
            // our concatenated assets all have map files that ride along. Here we're
            // telling the final stage packager to be sure and serve the map files
            // too.
            if (asset.kind === 'concatenated-asset') {
                assetPaths.push(asset.sourcemapPath);
            }
        }
        let meta = {
            type: 'app',
            version: 2,
            assets: assetPaths,
            babel: {
                filename: '_babel_config_.js',
                isParallelSafe: true, // TODO
                majorVersion: this.compatApp.babelMajorVersion(),
                fileFilter: '_babel_filter_.js',
            },
            'root-url': this.rootURL(),
        };
        // all compat apps are auto-upgraded, there's no v2 app format here
        meta['auto-upgraded'] = true;
        let pkg = this.combinePackageJSON(meta);
        (0, fs_extra_1.writeFileSync)((0, path_2.join)(this.root, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');
        let resolverConfig = this.resolverConfig(appFiles);
        this.addResolverConfig(resolverConfig);
        let babelConfig = this.babelConfig(resolverConfig);
        this.addBabelConfig(babelConfig);
    }
    combinePackageJSON(meta) {
        let pkgLayers = [this.origAppPackage.packageJSON];
        let fastbootConfig = this.fastbootConfig;
        if (fastbootConfig) {
            // fastboot-specific package.json output is allowed to add to our original package.json
            pkgLayers.push(fastbootConfig.packageJSON);
        }
        // but our own new v2 app metadata takes precedence over both
        pkgLayers.push({ keywords: ['ember-addon'], 'ember-addon': meta });
        return combinePackageJSON(...pkgLayers);
    }
    etcOptions(resolverConfig) {
        let transforms = this.compatApp.htmlbarsPlugins;
        let { plugins: macroPlugins, setConfig } = node_1.MacrosConfig.transforms();
        setConfig(this.compatApp.macrosConfig);
        for (let macroPlugin of macroPlugins) {
            transforms.push(macroPlugin);
        }
        if (this.options.staticComponents ||
            this.options.staticHelpers ||
            this.options.staticModifiers ||
            globalThis.embroider_audit) {
            let opts = {
                appRoot: resolverConfig.appRoot,
                emberVersion: this.emberVersion(),
            };
            transforms.push([require.resolve('./resolver-transform'), opts]);
        }
        let resolver = new core_1.Resolver(resolverConfig);
        let resolution = resolver.nodeResolve('ember-source/vendor/ember/ember-template-compiler', (0, path_1.resolve)(this.root, 'package.json'));
        if (resolution.type !== 'real') {
            throw new Error(`bug: unable to resolve ember-template-compiler from ${this.root}`);
        }
        return {
            transforms,
            compilerPath: resolution.filename,
            enableLegacyModules: ['ember-cli-htmlbars', 'ember-cli-htmlbars-inline-precompile', 'htmlbars-inline-precompile'],
        };
    }
    get portableHints() {
        return this.options.pluginHints.map(hint => {
            let cursor = (0, path_2.join)(this.origAppPackage.root, 'package.json');
            for (let i = 0; i < hint.resolve.length; i++) {
                let target = hint.resolve[i];
                if (i < hint.resolve.length - 1) {
                    target = (0, path_2.join)(target, 'package.json');
                }
                cursor = resolve_2.default.sync(target, { basedir: (0, path_2.dirname)(cursor) });
            }
            return {
                requireFile: cursor,
                useMethod: hint.useMethod,
                packageVersion: (0, portable_1.maybeNodeModuleVersion)(cursor),
            };
        });
    }
    addBabelConfig(pconfig) {
        if (!pconfig.isParallelSafe) {
            (0, core_1.warn)('Your build is slower because some babel plugins are non-serializable');
        }
        (0, fs_extra_1.writeFileSync)((0, path_2.join)(this.root, '_babel_config_.js'), `module.exports = ${JSON.stringify(pconfig.config, null, 2)}`, 'utf8');
        (0, fs_extra_1.writeFileSync)((0, path_2.join)(this.root, '_babel_filter_.js'), babelFilterTemplate({ skipBabel: this.options.skipBabel, appRoot: this.origAppPackage.root }), 'utf8');
    }
    addResolverConfig(config) {
        (0, fs_extra_1.outputJSONSync)((0, path_2.join)((0, core_1.locateEmbroiderWorkingDir)(this.compatApp.root), 'resolver.json'), config, { spaces: 2 });
    }
    shouldSplitRoute(routeName) {
        return (!this.options.splitAtRoutes ||
            this.options.splitAtRoutes.find(pattern => {
                if (typeof pattern === 'string') {
                    return pattern === routeName;
                }
                else {
                    return pattern.test(routeName);
                }
            }));
    }
    splitRoute(routeName, files, addToParent, addLazyBundle) {
        let shouldSplit = routeName && this.shouldSplitRoute(routeName);
        let ownFiles = [];
        let ownNames = new Set();
        if (files.template) {
            if (shouldSplit) {
                ownFiles.push(files.template);
                ownNames.add(routeName);
            }
            else {
                addToParent(routeName, files.template);
            }
        }
        if (files.controller) {
            if (shouldSplit) {
                ownFiles.push(files.controller);
                ownNames.add(routeName);
            }
            else {
                addToParent(routeName, files.controller);
            }
        }
        if (files.route) {
            if (shouldSplit) {
                ownFiles.push(files.route);
                ownNames.add(routeName);
            }
            else {
                addToParent(routeName, files.route);
            }
        }
        for (let [childName, childFiles] of files.children) {
            this.splitRoute(`${routeName}.${childName}`, childFiles, (childRouteName, childFile) => {
                // this is our child calling "addToParent"
                if (shouldSplit) {
                    ownFiles.push(childFile);
                    ownNames.add(childRouteName);
                }
                else {
                    addToParent(childRouteName, childFile);
                }
            }, (routeNames, files) => {
                addLazyBundle(routeNames, files);
            });
        }
        if (ownFiles.length > 0) {
            addLazyBundle([...ownNames], ownFiles);
        }
    }
    topAppJSAsset(engines, prepared) {
        let [app, ...childEngines] = engines;
        let relativePath = `assets/${this.origAppPackage.name}.js`;
        return this.appJSAsset(relativePath, app, childEngines, prepared, {
            autoRun: this.compatApp.autoRun,
            appBoot: !this.compatApp.autoRun ? this.compatApp.appBoot.readAppBoot() : '',
            mainModule: (0, core_1.explicitRelative)((0, path_2.dirname)(relativePath), 'app'),
            appConfig: this.configTree.readConfig().APP,
        });
    }
    get staticAppPathsPattern() {
        if (this.options.staticAppPaths.length > 0) {
            return new RegExp('^(?:' + this.options.staticAppPaths.map(staticAppPath => (0, escape_string_regexp_1.default)(staticAppPath)).join('|') + ')(?:$|/)');
        }
    }
    requiredOtherFiles(appFiles) {
        let pattern = this.staticAppPathsPattern;
        if (pattern) {
            return appFiles.otherAppFiles.filter(f => {
                return !pattern.test(f);
            });
        }
        else {
            return appFiles.otherAppFiles;
        }
    }
    appJSAsset(relativePath, appFiles, childEngines, prepared, entryParams) {
        let cached = prepared.get(relativePath);
        if (cached) {
            return cached;
        }
        let eagerModules = [];
        let requiredAppFiles = [this.requiredOtherFiles(appFiles)];
        if (!this.options.staticComponents) {
            requiredAppFiles.push(appFiles.components);
        }
        if (!this.options.staticHelpers) {
            requiredAppFiles.push(appFiles.helpers);
        }
        if (!this.options.staticModifiers) {
            requiredAppFiles.push(appFiles.modifiers);
        }
        let styles = [];
        // only import styles from engines with a parent (this excludeds the parent application) as their styles
        // will be inserted via a direct <link> tag.
        if (appFiles.engine.parent && appFiles.engine.package.isLazyEngine()) {
            let implicitStyles = this.impliedAssets('implicit-styles', appFiles);
            for (let style of implicitStyles) {
                styles.push({
                    path: (0, core_1.explicitRelative)('assets/_engine_', style.relativePath),
                });
            }
            let engineMeta = appFiles.engine.package.meta;
            if (engineMeta && engineMeta['implicit-styles']) {
                for (let style of engineMeta['implicit-styles']) {
                    styles.push({
                        path: (0, core_1.explicitRelative)((0, path_2.dirname)(relativePath), (0, path_2.join)(appFiles.engine.appRelativePath, style)),
                    });
                }
            }
        }
        let lazyEngines = [];
        for (let childEngine of childEngines) {
            let asset = this.appJSAsset(`assets/_engine_/${encodeURIComponent(childEngine.engine.package.name)}.js`, childEngine, [], prepared);
            if (childEngine.engine.package.isLazyEngine()) {
                lazyEngines.push({
                    names: [childEngine.engine.package.name],
                    path: (0, core_1.explicitRelative)((0, path_2.dirname)(relativePath), asset.relativePath),
                });
            }
            else {
                eagerModules.push((0, core_1.explicitRelative)((0, path_2.dirname)(relativePath), asset.relativePath));
            }
        }
        let lazyRoutes = [];
        for (let [routeName, routeFiles] of appFiles.routeFiles.children) {
            this.splitRoute(routeName, routeFiles, (_, filename) => {
                requiredAppFiles.push([filename]);
            }, (routeNames, files) => {
                let routeEntrypoint = `assets/_route_/${encodeURIComponent(routeNames[0])}.js`;
                if (!prepared.has(routeEntrypoint)) {
                    prepared.set(routeEntrypoint, this.routeEntrypoint(appFiles, routeEntrypoint, files));
                }
                lazyRoutes.push({
                    names: routeNames,
                    path: this.importPaths(appFiles, routeEntrypoint).buildtime,
                });
            });
        }
        let [fastboot, nonFastboot] = (0, partition_1.default)(excludeDotFiles((0, flatten_1.default)(requiredAppFiles)), file => appFiles.isFastbootOnly.get(file));
        let amdModules = nonFastboot.map(file => this.importPaths(appFiles, file));
        let fastbootOnlyAmdModules = fastboot.map(file => this.importPaths(appFiles, file));
        // this is a backward-compatibility feature: addons can force inclusion of
        // modules.
        eagerModules.push('./-embroider-implicit-modules.js');
        let params = { amdModules, fastbootOnlyAmdModules, lazyRoutes, lazyEngines, eagerModules, styles };
        if (entryParams) {
            Object.assign(params, entryParams);
        }
        let source = entryTemplate(params);
        let asset = {
            kind: 'in-memory',
            source,
            relativePath,
        };
        prepared.set(relativePath, asset);
        return asset;
    }
    importPaths({ engine }, engineRelativePath) {
        let noHBS = engineRelativePath.replace(this.resolvableExtensionsPattern, '').replace(/\.hbs$/, '');
        return {
            runtime: `${engine.modulePrefix}/${noHBS}`,
            buildtime: path_1.posix.join(engine.package.name, engineRelativePath),
        };
    }
    routeEntrypoint(appFiles, relativePath, files) {
        let [fastboot, nonFastboot] = (0, partition_1.default)(files, file => appFiles.isFastbootOnly.get(file));
        let asset = {
            kind: 'in-memory',
            source: routeEntryTemplate({
                files: nonFastboot.map(f => this.importPaths(appFiles, f)),
                fastbootOnlyFiles: fastboot.map(f => this.importPaths(appFiles, f)),
            }),
            relativePath,
        };
        return asset;
    }
    testJSEntrypoint(appFiles, prepared) {
        let asset = prepared.get(`assets/test.js`);
        if (asset) {
            return asset;
        }
        // We're only building tests from the first engine (the app). This is the
        // normal thing to do -- tests from engines don't automatically roll up into
        // the app.
        let engine = appFiles[0];
        const myName = 'assets/test.js';
        // tests necessarily also include the app. This is where we account for
        // that. The classic solution was to always include the app's separate
        // script tag in the tests HTML, but that isn't as easy for final stage
        // packagers to understand. It's better to express it here as a direct
        // module dependency.
        let eagerModules = [
            'ember-testing',
            (0, core_1.explicitRelative)((0, path_2.dirname)(myName), this.topAppJSAsset(appFiles, prepared).relativePath),
        ];
        let amdModules = [];
        // this is a backward-compatibility feature: addons can force inclusion of
        // test support modules.
        eagerModules.push('./-embroider-implicit-test-modules.js');
        for (let relativePath of engine.tests) {
            amdModules.push(this.importPaths(engine, relativePath));
        }
        let source = entryTemplate({
            amdModules,
            eagerModules,
            testSuffix: true,
        });
        asset = {
            kind: 'in-memory',
            source,
            relativePath: myName,
        };
        prepared.set(asset.relativePath, asset);
        return asset;
    }
}
exports.CompatAppBuilder = CompatAppBuilder;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "fastbootJSSrcDir", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "findTestemAsset", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "allActiveAddons", null);
__decorate([
    bind_decorator_1.default
], CompatAppBuilder.prototype, "isActiveAddon", null);
__decorate([
    bind_decorator_1.default
], CompatAppBuilder.prototype, "orderAddons", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "activeRules", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "resolvableExtensionsPattern", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "babelConfig", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "activeFastboot", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "fastbootConfig", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "portableHints", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatAppBuilder.prototype, "staticAppPathsPattern", null);
function defaultAddonPackageRules() {
    return (0, fs_extra_2.readdirSync)((0, path_2.join)(__dirname, 'addon-dependency-rules'))
        .map(filename => {
        if (filename.endsWith('.js')) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            return require((0, path_2.join)(__dirname, 'addon-dependency-rules', filename)).default;
        }
    })
        .filter(Boolean)
        .reduce((a, b) => a.concat(b), []);
}
const entryTemplate = (0, core_1.jsHandlebarsCompile)(`
import { importSync as i, macroCondition, getGlobalConfig } from '@embroider/macros';
let w = window;
let d = w.define;

{{#if styles}}
  if (macroCondition(!getGlobalConfig().fastboot?.isRunning)) {
    {{#each styles as |stylePath| ~}}
      i("{{js-string-escape stylePath.path}}");
    {{/each}}
  }
{{/if}}

{{#each eagerModules as |eagerModule| ~}}
  i("{{js-string-escape eagerModule}}");
{{/each}}

{{#each amdModules as |amdModule| ~}}
  d("{{js-string-escape amdModule.runtime}}", function(){ return i("{{js-string-escape amdModule.buildtime}}");});
{{/each}}

{{#if fastbootOnlyAmdModules}}
  if (macroCondition(getGlobalConfig().fastboot?.isRunning)) {
    {{#each fastbootOnlyAmdModules as |amdModule| ~}}
      d("{{js-string-escape amdModule.runtime}}", function(){ return i("{{js-string-escape amdModule.buildtime}}");});
    {{/each}}
  }
{{/if}}


{{#if lazyRoutes}}
w._embroiderRouteBundles_ = [
  {{#each lazyRoutes as |route|}}
  {
    names: {{json-stringify route.names}},
    load: function() {
      return import("{{js-string-escape route.path}}");
    }
  },
  {{/each}}
]
{{/if}}

{{#if lazyEngines}}
w._embroiderEngineBundles_ = [
  {{#each lazyEngines as |engine|}}
  {
    names: {{json-stringify engine.names}},
    load: function() {
      return import("{{js-string-escape engine.path}}");
    }
  },
  {{/each}}
]
{{/if}}

{{#if autoRun ~}}
if (!runningTests) {
  i("{{js-string-escape mainModule}}").default.create({{json-stringify appConfig}});
}
{{else  if appBoot ~}}
  {{ appBoot }}
{{/if}}

{{#if testSuffix ~}}
  {{!- TODO: both of these suffixes should get dynamically generated so they incorporate
       any content-for added by addons. -}}


  {{!- this is the traditional tests-suffix.js -}}
  i('../tests/test-helper');
  EmberENV.TESTS_FILE_LOADED = true;
{{/if}}
`);
const routeEntryTemplate = (0, core_1.jsHandlebarsCompile)(`
import { importSync as i } from '@embroider/macros';
let d = window.define;
{{#each files as |amdModule| ~}}
d("{{js-string-escape amdModule.runtime}}", function(){ return i("{{js-string-escape amdModule.buildtime}}");});
{{/each}}
{{#if fastbootOnlyFiles}}
  import { macroCondition, getGlobalConfig } from '@embroider/macros';
  if (macroCondition(getGlobalConfig().fastboot?.isRunning)) {
    {{#each fastbootOnlyFiles as |amdModule| ~}}
    d("{{js-string-escape amdModule.runtime}}", function(){ return i("{{js-string-escape amdModule.buildtime}}");});
    {{/each}}
  }
{{/if}}
`);
function stringOrBufferEqual(a, b) {
    if (typeof a === 'string' && typeof b === 'string') {
        return a === b;
    }
    if (a instanceof Buffer && b instanceof Buffer) {
        return Buffer.compare(a, b) === 0;
    }
    return false;
}
const babelFilterTemplate = (0, core_1.jsHandlebarsCompile)(`
const { babelFilter } = require(${JSON.stringify(require.resolve('@embroider/core'))});
module.exports = babelFilter({{json-stringify skipBabel}}, "{{js-string-escape appRoot}}");
`);
function combinePackageJSON(...layers) {
    function custom(objValue, srcValue, key, _object, _source, stack) {
        if (key === 'keywords' && stack.size === 0) {
            if (Array.isArray(objValue)) {
                return objValue.concat(srcValue);
            }
        }
    }
    return (0, mergeWith_1.default)({}, ...layers, custom);
}
function addCachablePlugin(babelConfig) {
    if (Array.isArray(babelConfig.plugins) && babelConfig.plugins.length > 0) {
        const plugins = Object.create(null);
        plugins[core_1.cacheBustingPluginPath] = core_1.cacheBustingPluginVersion;
        for (const plugin of babelConfig.plugins) {
            let absolutePathToPlugin;
            if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
                absolutePathToPlugin = plugin[0];
            }
            else if (typeof plugin === 'string') {
                absolutePathToPlugin = plugin;
            }
            else {
                throw new Error(`[Embroider] a babel plugin without an absolute path was from: ${plugin}`);
            }
            plugins[absolutePathToPlugin] = (0, portable_1.maybeNodeModuleVersion)(absolutePathToPlugin);
        }
        babelConfig.plugins.push([
            core_1.cacheBustingPluginPath,
            {
                plugins,
            },
        ]);
    }
}
function excludeDotFiles(files) {
    return files.filter(file => !file.startsWith('.') && !file.includes('/.'));
}
class ParsedEmberAsset {
    constructor(asset) {
        this.kind = 'parsed-ember';
        this.fileAsset = asset;
        this.html = new ember_html_1.PreparedEmberHTML(asset);
        this.relativePath = asset.relativePath;
    }
    validFor(other) {
        return this.fileAsset.mtime === other.mtime && this.fileAsset.size === other.size;
    }
}
class BuiltEmberAsset {
    constructor(asset) {
        this.kind = 'built-ember';
        this.parsedAsset = asset;
        this.source = asset.html.dom.serialize();
        this.relativePath = asset.relativePath;
    }
}
class ConcatenatedAsset {
    constructor(relativePath, sources, resolvableExtensions) {
        this.relativePath = relativePath;
        this.sources = sources;
        this.resolvableExtensions = resolvableExtensions;
        this.kind = 'concatenated-asset';
    }
    get sourcemapPath() {
        return this.relativePath.replace(this.resolvableExtensions, '') + '.map';
    }
}
//# sourceMappingURL=compat-app-builder.js.map