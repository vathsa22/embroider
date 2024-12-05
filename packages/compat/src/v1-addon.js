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
const typescript_memoize_1 = require("typescript-memoize");
const path_1 = require("path");
const pkg_up_1 = require("pkg-up");
const fs_extra_1 = require("fs-extra");
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
const broccoli_source_1 = require("broccoli-source");
const rewrite_package_json_1 = __importDefault(require("./rewrite-package-json"));
const messages_1 = require("@embroider/core/src/messages");
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const semver_1 = __importDefault(require("semver"));
const rewrite_addon_tree_1 = __importDefault(require("./rewrite-addon-tree"));
const merges_1 = require("./merges");
const core_1 = require("@embroider/core");
const walk_sync_1 = __importDefault(require("walk-sync"));
const observe_tree_1 = __importDefault(require("./observe-tree"));
const node_1 = require("@embroider/macros/src/node");
const modules_compat_1 = __importDefault(require("./modules-compat"));
const broccoli_file_creator_1 = __importDefault(require("broccoli-file-creator"));
const synthesize_template_only_components_1 = __importDefault(require("./synthesize-template-only-components"));
const detect_babel_plugins_1 = require("./detect-babel-plugins");
const hbs_to_js_broccoli_plugin_1 = __importDefault(require("./hbs-to-js-broccoli-plugin"));
const lodash_1 = require("lodash");
const prepare_htmlbars_ast_plugins_1 = __importDefault(require("./prepare-htmlbars-ast-plugins"));
const get_real_addon_1 = __importDefault(require("./get-real-addon"));
const stockTreeNames = Object.freeze([
    'addon',
    'addon-styles',
    'styles',
    'addon-test-support',
    'test-support',
    'app',
    'public',
    'vendor',
    // 'addon-templates' and 'templates are trees too, but they live inside
    // 'addon' and 'app' and we handle them there.
]);
const dynamicTreeHooks = Object.freeze([
    'treeFor',
    'treeForAddon',
    'treeForAddonTemplates',
    'treeForAddonTestSupport',
    'treeForApp',
    'treeForPublic',
    'treeForStyles',
    'treeForTemplates',
    'treeForTestSupport',
    'treeForVendor',
]);
const defaultMethods = {
    app: 'treeForApp',
    addon: 'treeForAddon',
    'addon-styles': 'treeForAddonStyles',
    'addon-templates': 'treeForAddonTemplates',
    'addon-test-support': 'treeForAddonTestSupport',
    public: 'treeForPublic',
    styles: 'treeForStyles',
    templates: 'treeForTemplates',
    'test-support': 'treeForTestSupport',
    vendor: 'treeForVendor',
};
const appPublicationDir = '_app_';
const fastbootPublicationDir = '_fastboot_';
// This controls and types the interface between our new world and the classic
// v1 addon instance.
class V1Addon {
    constructor(addonInstance, addonOptions, app, packageCache, orderIdx) {
        this.addonInstance = addonInstance;
        this.addonOptions = addonOptions;
        this.app = app;
        this.packageCache = packageCache;
        this.orderIdx = orderIdx;
        if (addonInstance.registry) {
            this.updateRegistry(addonInstance.registry);
        }
    }
    // Optional extensible hook for pruning down the list of redundant addon
    // instances produced by the classic ember-cli architecture. ember-cli
    // instantiates each addon *per consumer*, not per package. So a given package
    // will have many addon instances, and Embroider dutifully produces a V1Addon
    // instance for each one, and then needs to mimic the classic smooshing
    // behavior between them.
    //
    // But some packages (and ember-cli-babel is the motivating example) produce a
    // huge number of instances that do nothing useful and incur significant cost.
    // This hook allows their compat adapter to prune down the set, using
    // addon-specific knowledge of which instance(s) are actually important.
    //
    // The order of the instances is significant. The first one is the one with
    // the highest precedence, meaning its files would win under classic
    // smooshing.
    reduceInstances(instances) {
        // the default beahvior is that all copies matter
        return instances;
    }
    // this is only defined when there are custom AST transforms that need it
    get templateCompilerBabelPlugin() {
        let plugins = (0, prepare_htmlbars_ast_plugins_1.default)(this.addonInstance.registry);
        // our macros don't run here in stage1
        plugins = plugins.filter((p) => !(0, node_1.isEmbroiderMacrosPlugin)(p));
        if (plugins.length > 0) {
            let compilerPath = require.resolve('ember-source/dist/ember-template-compiler.js', {
                paths: [(0, core_1.findTopmostAddon)(this.addonInstance).parent.root],
            });
            let opts = {
                compilerPath,
                targetFormat: 'hbs',
                enableLegacyModules: [
                    'ember-cli-htmlbars',
                    'ember-cli-htmlbars-inline-precompile',
                    'htmlbars-inline-precompile',
                ],
                transforms: plugins,
            };
            return [require.resolve('babel-plugin-ember-template-compilation'), opts];
        }
    }
    updateRegistry(registry) {
        // auto-import gets disabled because we support it natively
        registry.remove('js', 'ember-auto-import-analyzer');
        // here we're replacing the stock template compiler with our own. Ours
        // doesn't compile all the way to wire format -- it does source-to-source
        // transformation just to process custom AST transforms, while leaving the
        // template as a template. It does turn HBS files into equivalent JS files
        // (because in the general case, AST transforms may need to emit values in
        // Javascript scope), but those JS files will contain HBS strings, not wire
        // format.
        //
        // Even when no AST transforms are registered, we'll still need to register
        // a no-op transform here to avoid an exception coming out of ember-cli like
        // "Addon templates were detected, but there are no template compilers
        // registered".
        registry.remove('template', 'ember-cli-htmlbars');
        registry.add('template', {
            name: 'embroider-addon-templates',
            ext: 'hbs',
            _addon: this,
            toTree(tree) {
                if (this._addon.templateCompilerBabelPlugin) {
                    return new hbs_to_js_broccoli_plugin_1.default(tree);
                }
                else {
                    // when there are no custom AST transforms, we don't need to do
                    // anything at all.
                    return tree;
                }
            },
        });
        // first, look into the babel config and related packages to decide whether
        // we need to run babel at all in this stage.
        let needsCustomBabel = this.needsCustomBabel();
        // regardless of the answer, we modify the babel config, because even if
        // we're unregistering ember-cli-babel, some addons manually invoke
        // ember-cli-babel in their custom hooks, and in that case we want to be
        // sure we've taken out the babel plugins that really shouldn't run at this
        // stage.
        this.updateBabelConfig();
        if (!needsCustomBabel) {
            // no custom babel behavior, so we don't run the ember-cli-babel
            // preprocessor at all. We still need to register a no-op preprocessor to
            // prevent ember-cli from emitting a deprecation warning.
            registry.remove('js', 'ember-cli-babel');
            registry.add('js', {
                name: 'embroider-babel-noop',
                ext: 'js',
                toTree(tree) {
                    return tree;
                },
            });
        }
    }
    // we need to run custom inline hbs preprocessing if there are custom hbs
    // plugins and there are inline hbs templates
    needsInlineHBS() {
        if (!this.templateCompilerBabelPlugin) {
            // no custom transforms
            return false;
        }
        if (this.addonInstance.addons.find((a) => a.name === 'ember-cli-htmlbars-inline-precompile')) {
            // the older inline template compiler is present
            return true;
        }
        if (this.addonInstance.addons.find((a) => a.name === 'ember-cli-htmlbars' && semver_1.default.satisfies(semver_1.default.coerce(a.pkg.version) || a.pkg.version, '>4.0.0'))) {
            // a version of ember-cli-htmlbars that natively supports inline hbs is present
            return true;
        }
        return false;
    }
    needsCustomBabel() {
        var _a, _b, _c, _d;
        if (this.addonInstance.addons.find((a) => a.name === 'ember-cli-typescript' &&
            semver_1.default.satisfies(semver_1.default.coerce(a.pkg.version) || a.pkg.version, '>=4.0.0-alpha.1'))) {
            // This addon is using ember-cli-typescript 4, which relies on
            // ember-cli-babel to add the TypeScript transform Babel plugin.
            return true;
        }
        if (this.addonInstance.options &&
            this.addonInstance.options['ember-cli-babel'] &&
            this.addonInstance.options['ember-cli-babel'].enableTypeScriptTransform) {
            // This addon has explicitly configured ember-cli-babel to add the
            // TypeScript transform Babel plugin.
            return true;
        }
        if (((_d = (_c = (_b = (_a = this.options.babel) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.filter(babelPluginAllowedInStage1)) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 0) {
            // this addon has custom babel plugins, so we need to run them here in
            // stage1
            return true;
        }
        // even if there are no custom babel plugins, if we need to do any
        // preprocessing of inline handlebars templates we still need to run the
        // custom babel.
        return this.needsInlineHBS();
    }
    get name() {
        return this.packageJSON.name;
    }
    // you can override this to change the *input* packageJSON that the rest of
    // stage1 will see. If you want to see and change the *output* packageJSON see
    // `newPackageJSON`.
    get packageJSON() {
        return this.packageCache.get(this.root).packageJSON;
    }
    get newPackageJSON() {
        // shallow copy only! This is OK as long as we're only changing top-level
        // keys in this method
        let pkg = Object.assign({}, this.packageJSON);
        let meta = Object.assign({}, this.packageCache.get(this.root).meta, this.packageMeta);
        pkg['ember-addon'] = meta;
        // classic addons don't get to customize their entrypoints like this. We
        // always rewrite them so their entrypoint is index.js, so whatever was here
        // is just misleading to stage3 packagers that might look (rollup does).
        delete pkg.main;
        delete pkg.module;
        delete pkg.exports;
        return pkg;
    }
    get root() {
        // addonInstance.root gets modified by a customized "main" or
        // "ember-addon.main" in package.json. We want the real package root here
        // (the place where package.json lives).
        return (0, path_1.dirname)((0, pkg_up_1.sync)({ cwd: this.addonInstance.root }));
    }
    get mainModule() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(this.addonInstance.constructor._meta_.modulePath);
        if (typeof mod === 'function') {
            return mod.prototype;
        }
        else {
            return mod;
        }
    }
    get options() {
        if (!this.addonInstance.options) {
            this.addonInstance.options = {};
            return this.addonInstance.options;
        }
        // some addons (like ember-cli-inline-content) assign the *app's* options
        // onto their own this.options. Which means they (accidentally or on
        // purpose), always get the app's babel config, and it means when we try
        // to modify the addon's babel config we're accidentally modifying the
        // app's too.
        //
        // So here we do copying to ensure that we can modify the babel config
        // without altering anybody else. We're not doing cloneDeep because that
        // pulls on our lazy MacrosConfig if it appears in any babel configs here,
        // whereas we want to leave it unevaluated until babel actually uses it.
        let addonOptions = typeof this.addonInstance.options == 'function' ? this.addonInstance.options() : this.addonInstance.options;
        let options = Object.assign({}, addonOptions);
        if (options.babel) {
            options.babel = Object.assign({}, options.babel);
            if (options.babel.plugins) {
                options.babel.plugins = options.babel.plugins.slice();
            }
        }
        if (options['ember-cli-babel']) {
            options['ember-cli-babel'] = Object.assign({}, options['ember-cli-babel']);
        }
        if (typeof this.addonInstance.options == 'function') {
            this.addonInstance.options = () => options;
        }
        else {
            this.addonInstance.options = options;
        }
        return options;
    }
    customizes(...treeNames) {
        // get the real addon as we're going to compare with __proto__
        const realAddon = (0, get_real_addon_1.default)(this.addonInstance);
        return Boolean(treeNames.find(treeName => {
            return (
            // customized hook exists in actual code exported from their index.js
            this.mainModule[treeName] ||
                // addon instance doesn't match its own prototype
                (realAddon.__proto__ && realAddon[treeName] !== realAddon.__proto__[treeName]) ||
                this.customizesHookName(treeName));
        }));
    }
    customizesHookName(treeName) {
        if (!this.addonInstance.treeForMethods) {
            // weird old addons don't even extend ember-cli's Addon base class and
            // might not have this.
            return false;
        }
        for (let [name, methodName] of Object.entries(defaultMethods)) {
            if (methodName === treeName) {
                return this.addonInstance.treeForMethods[name] !== methodName;
            }
        }
        return false;
    }
    hasStockTree(treeName) {
        if (this.suppressesTree(treeName)) {
            return false;
        }
        // we need to use this.addonInstance.root instead of this.root here because
        // we're looking for the classic location of the stock tree, and that
        // location is influenced by a customized ember-addon.main in package.json,
        // which is reflected in addonInstance.root.
        return (this.addonInstance.treePaths && (0, fs_extra_1.existsSync)((0, path_1.join)(this.addonInstance.root, this.addonInstance.treePaths[treeName])));
    }
    hasAnyTrees() {
        return Boolean(stockTreeNames.find(name => this.hasStockTree(name))) || this.customizes(...dynamicTreeHooks);
    }
    // we keep all these here to ensure that we always apply the same options to
    // the same tree, so that our cache doesn't need to worry about varying
    // options.
    stockTreeFunnelOptions(treeName) {
        switch (treeName) {
            case 'addon':
                return {
                    exclude: ['styles/**'],
                };
            case 'styles':
                return {
                    destDir: '_app_styles_',
                };
            case 'addon-test-support':
                return {
                    destDir: 'test-support',
                };
            case 'app':
                return {
                    exclude: ['styles/**'],
                    destDir: appPublicationDir,
                };
            case 'public':
                return {
                    destDir: `public/${this.moduleName}`,
                };
            case 'vendor':
                return {
                    destDir: 'vendor',
                };
        }
    }
    stockTree(treeName) {
        return this.throughTreeCache(treeName, 'stock', () => {
            // adjust from the legacy "root" to our real root, because our rootTree
            // uses our real root but the stock trees are defined in terms of the
            // legacy root
            let srcDir = (0, path_1.relative)(this.root, (0, path_1.join)(this.addonInstance.root, this.addonInstance.treePaths[treeName]));
            let opts = Object.assign({ srcDir }, this.stockTreeFunnelOptions(treeName));
            return (0, broccoli_funnel_1.default)(this.rootTree, opts);
        });
    }
    get rootTree() {
        if (this.packageCache.get(this.root).mayRebuild) {
            return new broccoli_source_1.WatchedDir(this.root);
        }
        else {
            return new broccoli_source_1.UnwatchedDir(this.root);
        }
    }
    get moduleName() {
        if (typeof this.addonInstance.moduleName === 'function') {
            return this.addonInstance.moduleName();
        }
        return this.addonInstance.name;
    }
    // applies preprocessors to JS and HBS
    transpile(tree) {
        var _a;
        // Namespace the tree being passed to preprocessJs with the moduleName
        // to mimic classic build
        tree = (0, broccoli_funnel_1.default)(tree, { destDir: this.moduleName });
        if (this.addonInstance.shouldCompileTemplates() && ((_a = this.addonInstance.registry.load('template')) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            tree = this.app.preprocessRegistry.preprocessTemplates(tree, {
                registry: this.addonInstance.registry,
            });
        }
        tree = this.addonInstance.preprocessJs(tree, '/', this.moduleName, {
            registry: this.addonInstance.registry,
        });
        // Remove namespacing so that it gets written out to the node_modules
        // directory correctly.
        tree = (0, broccoli_funnel_1.default)(tree, {
            srcDir: this.moduleName,
        });
        return tree;
    }
    updateBabelConfig() {
        let packageOptions = this.options;
        let emberCLIBabelInstance = this.addonInstance.addons.find((a) => a.name === 'ember-cli-babel');
        let version;
        if (emberCLIBabelInstance) {
            version = emberCLIBabelInstance.pkg.version;
        }
        if (!packageOptions['ember-cli-babel']) {
            packageOptions['ember-cli-babel'] = {};
        }
        if (!packageOptions.babel) {
            packageOptions.babel = {};
        }
        let babelConfig = packageOptions.babel;
        Object.assign(packageOptions['ember-cli-babel'], {
            compileModules: false,
            disablePresetEnv: true,
            disableDebugTooling: true,
            disableEmberModulesAPIPolyfill: true,
        });
        if (version && semver_1.default.satisfies(semver_1.default.coerce(version) || version, '^5')) {
            (0, messages_1.unsupported)(`${this.name} is using babel 5. Not installing our custom plugin.`);
            return;
        }
        if (!babelConfig.plugins) {
            babelConfig.plugins = [];
        }
        else {
            let hadAutoImport = Boolean(babelConfig.plugins.find(detect_babel_plugins_1.isEmberAutoImportDynamic));
            babelConfig.plugins = babelConfig.plugins.filter(babelPluginAllowedInStage1);
            if (hadAutoImport) {
                // if we removed ember-auto-import's dynamic import() plugin, the code
                // may use import() syntax and we need to re-add it to the parser.
                if (version && semver_1.default.satisfies(semver_1.default.coerce(version) || version, '^6')) {
                    babelConfig.plugins.push(require.resolve('babel-plugin-syntax-dynamic-import'));
                }
                else {
                    babelConfig.plugins.push(require.resolve('@babel/plugin-syntax-dynamic-import'));
                }
            }
        }
        if (this.templateCompilerBabelPlugin) {
            babelConfig.plugins.push(this.templateCompilerBabelPlugin);
        }
    }
    get v2Tree() {
        return this.throughTreeCache(
        // these are all the kinds of trees that ember-cli's tree cache
        // understands. We need them all here because if *any* of these are
        // uncacheable, we want our whole v2 tree to be treated as uncacheable.
        [
            'app',
            'addon',
            'addon-styles',
            'addon-templates',
            'addon-test-support',
            'public',
            'styles',
            'templates',
            'test-support',
            'vendor',
        ], 'v2Tree', () => (0, broccoli_merge_trees_1.default)(this.v2Trees, { overwrite: true }));
    }
    // this is split out so that compatibility shims can override it to add more
    // things to the package metadata.
    get packageMeta() {
        let built = this.build();
        return (0, merges_1.mergeWithAppend)({
            version: 2,
            'auto-upgraded': true,
            type: 'addon',
        }, built.staticMeta, ...built.dynamicMeta.map(d => d()));
    }
    get v2Trees() {
        let { trees } = this.build();
        return trees;
    }
    throughTreeCache(nameOrNames, category, fn) {
        let cacheKey;
        if (typeof this.addonInstance.cacheKeyForTree === 'function') {
            let names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames];
            cacheKey = names.reduce((accum, name) => {
                var _a, _b;
                if (accum == null) {
                    // a previous name was uncacheable, so we're entirely uncacheable
                    return undefined;
                }
                let key = (_b = (_a = this.addonInstance).cacheKeyForTree) === null || _b === void 0 ? void 0 : _b.call(_a, name);
                if (key) {
                    return accum + key;
                }
                else {
                    return undefined;
                }
            }, '');
            if (cacheKey) {
                cacheKey = cacheKey + category;
                let cachedTree = this.app.addonTreeCache.get(cacheKey);
                if (cachedTree) {
                    (0, core_1.debug)('cache hit %s %s %s', this.name, nameOrNames, category);
                    return cachedTree;
                }
            }
        }
        (0, core_1.debug)('cache miss %s %s %s', this.name, nameOrNames, category);
        let tree = fn();
        if (tree && cacheKey) {
            this.app.addonTreeCache.set(cacheKey, tree);
        }
        return tree;
    }
    // In general, we can't reliably run addons' custom `treeFor()` methods,
    // because they recurse in a way that we absolutely don't want.
    //
    // But there is a very common use case that we *can* handle opportunisticaly,
    // which is a treeFor() that's used purely to guard whether `_super` will be
    // called or not.
    suppressesTree(name) {
        var _a;
        if (!this.customizes('treeFor')) {
            return false;
        }
        // get the real addon as we're going to patch and restore `_super`
        const realAddon = (0, get_real_addon_1.default)(this.addonInstance);
        let origSuper = this.addonInstance._super;
        try {
            realAddon._super = stubbedSuper;
            let result = (_a = this.mainModule.treeFor) === null || _a === void 0 ? void 0 : _a.call(this.addonInstance, name);
            if (result === markedEmptyTree) {
                // the method returns _super unchanged, so tree is not suppressed and we
                // understand what's going on
                return false;
            }
            if (result == null) {
                // the method nulled out the tree, so we are definitely suppressing
                return true;
            }
            // we can't tell what's really going on, don't suppress and hope for the
            // best
            (0, messages_1.unsupported)(`${this.name} has a custom treeFor() method that is doing some arbitrary broccoli processing.`);
            return false;
        }
        finally {
            if (realAddon._super === stubbedSuper) {
                realAddon._super = origSuper;
            }
        }
    }
    invokeOriginalTreeFor(name, { neuterPreprocessors } = { neuterPreprocessors: false }) {
        // @ts-expect-error have no idea why throughTreeCache overload is not working here..
        return this.throughTreeCache(name, 'original', () => {
            // get the real addon as we're going to patch and restore `preprocessJs`
            const realAddon = (0, get_real_addon_1.default)(this.addonInstance);
            let original;
            try {
                if (neuterPreprocessors) {
                    original = realAddon.preprocessJs;
                    realAddon.preprocessJs = function (tree) {
                        return tree;
                    };
                }
                if (this.suppressesTree(name)) {
                    return undefined;
                }
                return this.addonInstance._treeFor(name);
            }
            finally {
                if (neuterPreprocessors) {
                    realAddon.preprocessJs = original;
                }
            }
        });
    }
    treeForAddon(built) {
        // the extra isEngine condition is because ember-engines injects a
        // treeForAddon method into each engine addon that we really don't need or
        // want to run. Unfortunately there's not a more localized place to patch it
        // out, partly because ember-engines also uses a bogus inheritance strategy
        // (instead of providing a prototype that engine addons can extend it
        // patches things into their instance directly).
        if (this.customizes('treeForAddon', 'treeForAddonTemplates') && !this.isEngine()) {
            let tree = this.invokeOriginalTreeFor('addon', { neuterPreprocessors: true });
            if (tree) {
                tree = (0, modules_compat_1.default)(tree);
                // this captures addons that are trying to escape their own package's
                // namespace
                let result = (0, rewrite_addon_tree_1.default)(this.transpile(tree), this.name, this.moduleName);
                built.dynamicMeta.push(result.getMeta);
                return result.tree;
            }
        }
        else if (this.hasStockTree('addon')) {
            return this.transpile(this.stockTree('addon'));
        }
    }
    addonStylesTree() {
        if (this.customizes('treeForAddonStyles')) {
            let custom = this.invokeOriginalTreeFor('addon-styles');
            if (custom) {
                return this.addonInstance.compileStyles(custom);
            }
        }
        else if (this.hasStockTree('addon-styles')) {
            return this.addonInstance.compileStyles(this.stockTree('addon-styles'));
        }
    }
    treeForTestSupport() {
        if (this.customizes('treeForTestSupport')) {
            (0, messages_1.todo)(`${this.name} has customized the test support tree`);
        }
        else if (this.hasStockTree('test-support')) {
            // this one doesn't go through transpile yet because it gets handled as
            // part of the consuming app. For example, imports should be relative to
            // the consuming app, not our own package.
            return (0, broccoli_funnel_1.default)(this.stockTree('test-support'), {
                destDir: `${appPublicationDir}/tests`,
            });
        }
    }
    buildTreeForAddon(built) {
        let tree = this.treeForAddon(built);
        if (!tree) {
            return;
        }
        let templateOnlyComponents = new synthesize_template_only_components_1.default(tree, {
            allowedPaths: ['components'],
            // if an addon has custom AST transforms, stage1 can rewrite .hbs to
            // .hbs.js
            templateExtensions: ['.hbs', '.hbs.js'],
        });
        if (this.addonOptions.staticAddonTrees) {
            if (this.isEngine()) {
                // even when staticAddonTrees is enabled, engines may have a router map
                // that needs to be dynamically resolved.
                let hasRoutesModule = false;
                tree = new observe_tree_1.default(tree, outputDir => {
                    hasRoutesModule = (0, fs_extra_1.existsSync)((0, path_1.resolve)(outputDir, 'routes.js'));
                });
                built.dynamicMeta.push(() => ({
                    'implicit-modules': hasRoutesModule ? ['./routes.js'] : [],
                }));
            }
        }
        else {
            let filenames = [];
            let templateOnlyComponentNames = [];
            tree = new observe_tree_1.default(tree, outputDir => {
                filenames = (0, walk_sync_1.default)(outputDir, { globs: ['**/*.js', '**/*.hbs'] })
                    .map(f => `./${f.replace(/\.js$/i, '')}`)
                    .filter(notColocatedTemplate);
            });
            templateOnlyComponents = new observe_tree_1.default(templateOnlyComponents, outputDir => {
                templateOnlyComponentNames = (0, walk_sync_1.default)(outputDir, { globs: ['**/*.js'] }).map(f => `./${f.replace(/\.js$/i, '')}`);
            });
            built.dynamicMeta.push(() => ({
                'implicit-modules': filenames.concat(templateOnlyComponentNames),
            }));
        }
        built.trees.push(tree);
        built.trees.push(templateOnlyComponents);
    }
    buildAddonStyles(built) {
        let addonStylesTree = this.addonStylesTree();
        if (addonStylesTree) {
            if (this.app.hasCompiledStyles) {
                // >= ember-cli@3.18 store css files in <addon-name/__COMPILED_STYLES__
                // and for embroider to work correctly need to be moved back to `/`
                //
                // speaking with @rwjblue the ember-cli build is now frozen, and it is
                // ok to assume that after the above version no changes will occur
                // makings this work-around safe.
                //
                // additional context: https://github.com/embroider-build/embroider/pull/934/files#r695269976
                addonStylesTree = (0, broccoli_funnel_1.default)(addonStylesTree, {
                    srcDir: `${this.name}/__COMPILED_STYLES__`,
                    destDir: '/',
                    allowEmpty: true,
                });
            }
            let discoveredFiles = [];
            let tree = new observe_tree_1.default(addonStylesTree, outputPath => {
                discoveredFiles = (0, walk_sync_1.default)(outputPath, { globs: ['**/*.css'], directories: false });
            });
            built.trees.push(tree);
            built.dynamicMeta.push(() => {
                return {
                    'implicit-styles': discoveredFiles.map(f => `./${f}`),
                };
            });
        }
    }
    buildTreeForStyles(built) {
        let tree;
        if (this.customizes('treeForStyles')) {
            // the user's tree returns their own styles with no "app/styles" wrapping
            // around, which is actually what we want
            tree = this.invokeOriginalTreeFor('styles');
            if (tree) {
                tree = (0, broccoli_funnel_1.default)(tree, {
                    destDir: '_app_styles_',
                    getDestinationPath(path) {
                        return path.replace(/^app\/styles\//, '');
                    },
                });
            }
        }
        else if (this.hasStockTree('styles')) {
            tree = this.stockTree('styles');
        }
        if (tree) {
            built.trees.push(tree);
        }
    }
    buildAddonTestSupport(built) {
        let addonTestSupportTree;
        if (this.customizes('treeForAddonTestSupport')) {
            let original = this.invokeOriginalTreeFor('addon-test-support', { neuterPreprocessors: true });
            if (original) {
                let { tree, getMeta } = (0, rewrite_addon_tree_1.default)(original, this.name, this.moduleName);
                addonTestSupportTree = this.transpile(tree);
                built.dynamicMeta.push(getMeta);
            }
        }
        else if (this.hasStockTree('addon-test-support')) {
            addonTestSupportTree = this.transpile(this.stockTree('addon-test-support'));
        }
        if (addonTestSupportTree) {
            if (!this.addonOptions.staticAddonTestSupportTrees) {
                let filenames = [];
                addonTestSupportTree = new observe_tree_1.default(addonTestSupportTree, outputPath => {
                    filenames = (0, walk_sync_1.default)(outputPath, { globs: ['**/*.js', '**/*.hbs'] }).map(f => `./${f.replace(/.js$/i, '')}`);
                });
                built.dynamicMeta.push(() => ({
                    'implicit-test-modules': filenames,
                }));
            }
            built.trees.push(addonTestSupportTree);
        }
    }
    maybeSetDirectoryMeta(built, tree, localDir, key) {
        let files;
        built.dynamicMeta.push(() => {
            if (files) {
                return { [key]: files };
            }
            else {
                return {};
            }
        });
        return new observe_tree_1.default(tree, (outputPath) => {
            let dir = (0, path_1.join)(outputPath, localDir);
            if ((0, fs_extra_1.existsSync)(dir)) {
                files = (0, lodash_1.fromPairs)((0, walk_sync_1.default)(dir, { globs: ['**/*.js', '**/*.hbs'] }).map(f => [`./${f}`, `./${localDir}/${f}`]));
            }
            else {
                files = undefined;
            }
        });
    }
    buildTestSupport(built) {
        let tree = this.treeForTestSupport();
        if (tree) {
            tree = this.maybeSetDirectoryMeta(built, tree, appPublicationDir, 'app-js');
            built.trees.push(tree);
        }
    }
    buildTreeForApp(built) {
        let appTree;
        if (this.customizes('treeForApp', 'treeForTemplates')) {
            let original = this.invokeOriginalTreeFor('app');
            if (original) {
                appTree = (0, broccoli_funnel_1.default)(original, {
                    destDir: appPublicationDir,
                });
            }
        }
        else if (this.hasStockTree('app')) {
            appTree = this.stockTree('app');
        }
        if (appTree) {
            // this one doesn't go through transpile yet because it gets handled as
            // part of the consuming app.
            appTree = this.maybeSetDirectoryMeta(built, appTree, appPublicationDir, 'app-js');
            built.trees.push(appTree);
        }
        if (typeof this.addonInstance.isDevelopingAddon === 'function' &&
            this.addonInstance.isDevelopingAddon() &&
            this.addonInstance.hintingEnabled()) {
            let hintTree = this.addonInstance.jshintAddonTree();
            if (hintTree) {
                hintTree = this.maybeSetDirectoryMeta(built, (0, broccoli_funnel_1.default)(hintTree, { destDir: appPublicationDir }), appPublicationDir, 'app-js');
                built.trees.push(hintTree);
            }
        }
    }
    buildTreeForFastBoot(built) {
        let tree;
        if (this.customizes('treeForFastBoot')) {
            // Arguably, it would be more correct to always create the new Funnel,
            // because the fastboot directory could be created *after* our build starts.
            // But that would result in hundreds of additional trees, even though the
            // vast majority of addons aren't changing and don't have fastboot
            // directories. So I'm pretty comfortable with the optimization. It means
            // that an addon author who creates a brand new fastboot directory in a v1
            // packages will need to restart their build. (Really we hope new addons
            // will be authored in v2 instead soon anyway, and they won't need the
            // concept of "fastboot directory" because they can use the macro system to
            // conditionally import some things only in fastboot.)
            if ((0, fs_extra_1.pathExistsSync)((0, path_1.join)(this.root, 'fastboot'))) {
                tree = (0, broccoli_funnel_1.default)(this.rootTree, { srcDir: 'fastboot' });
            }
            tree = this.addonInstance.treeForFastBoot(tree);
            if (tree) {
                tree = (0, broccoli_funnel_1.default)(tree, { destDir: fastbootPublicationDir });
            }
        }
        else {
            if ((0, fs_extra_1.pathExistsSync)((0, path_1.join)(this.root, 'fastboot'))) {
                tree = (0, broccoli_funnel_1.default)(this.rootTree, { srcDir: 'fastboot', destDir: fastbootPublicationDir });
            }
        }
        if (tree) {
            // this one doesn't go through transpile yet because it gets handled as
            // part of the consuming app.
            tree = this.maybeSetDirectoryMeta(built, tree, fastbootPublicationDir, 'fastboot-js');
            built.trees.push(tree);
        }
    }
    buildPublicTree(built) {
        let publicTree;
        // the extra isEngine condition is here because ember-engines injects a
        // customized treeForPublic into every engine addon. We don't want or need
        // it to run.
        if (this.customizes('treeForPublic') && !this.isEngine()) {
            let original = this.invokeOriginalTreeFor('public');
            if (original) {
                publicTree = (0, broccoli_funnel_1.default)(original, {
                    destDir: 'public',
                });
            }
        }
        else if (this.hasStockTree('public')) {
            publicTree = this.stockTree('public');
        }
        if (publicTree) {
            let publicAssets = {};
            publicTree = new observe_tree_1.default(publicTree, (outputPath) => {
                publicAssets = {};
                for (let filename of (0, walk_sync_1.default)((0, path_1.join)(outputPath, 'public'))) {
                    if (!filename.endsWith('/')) {
                        publicAssets[`./public/${filename}`] = './' + filename;
                    }
                }
            });
            built.trees.push(publicTree);
            built.dynamicMeta.push(() => ({ 'public-assets': publicAssets }));
        }
    }
    buildVendorTree(built) {
        if (this.customizes('treeForVendor')) {
            // We don't have any particular opinions about the structure inside
            // vendor, so even when it's customized we can just use the customized
            // one.
            let tree = this.invokeOriginalTreeFor('vendor');
            if (tree) {
                built.trees.push((0, broccoli_funnel_1.default)(tree, {
                    destDir: 'vendor',
                }));
            }
        }
        else if (this.hasStockTree('vendor')) {
            built.trees.push(this.stockTree('vendor'));
        }
    }
    isEngine() {
        return typeof this.addonInstance.getEngineConfigContents === 'function';
    }
    buildEngineConfig(built) {
        var _a, _b, _c, _d;
        if (!this.isEngine()) {
            return;
        }
        // this addon is an engine, so it needs its own config/environment.js.
        // ember-engines always emits a separate inline (not-meta-tag) config for
        // fastboot, so we mimic that behavior here.
        //
        // getEngineConfigContents is an arbitrary customizable module, so we can't
        // easily rewrite it to live inside our conditional, so it's safer in a
        // separate module.
        built.trees.push((0, broccoli_file_creator_1.default)('config/_environment_browser_.js', (_b = (_a = this.addonInstance).getEngineConfigContents) === null || _b === void 0 ? void 0 : _b.call(_a)));
        built.trees.push((0, broccoli_file_creator_1.default)('config/environment.js', `
      import { macroCondition, getGlobalConfig, importSync } from '@embroider/macros';
      let config;
      if (macroCondition(getGlobalConfig().fastboot?.isRunning)){
        config = ${JSON.stringify((_d = (_c = this.addonInstance).engineConfig) === null || _d === void 0 ? void 0 : _d.call(_c, this.app.env, {}), null, 2)};
      } else {
        config = importSync('./_environment_browser_.js').default;
      }
      export default config;
    `));
    }
    buildPackageJSON(built) {
        built.trees.push(new rewrite_package_json_1.default(this.rootTree, () => this.newPackageJSON));
    }
    build() {
        let built = new IntermediateBuild();
        built.staticMeta['order-index'] = this.orderIdx;
        if (this.options.lazyLoading === true || (this.options.lazyLoading && this.options.lazyLoading.enabled)) {
            built.staticMeta['lazy-engine'] = true;
        }
        if (this.moduleName !== this.name) {
            built.staticMeta['renamed-packages'] = {
                [this.moduleName]: this.name,
            };
        }
        this.buildTreeForAddon(built);
        this.buildAddonStyles(built);
        this.buildTreeForStyles(built);
        this.buildAddonTestSupport(built);
        this.buildTestSupport(built);
        this.buildTreeForApp(built);
        this.buildTreeForFastBoot(built);
        this.buildPublicTree(built);
        this.buildVendorTree(built);
        this.buildEngineConfig(built);
        this.buildPackageJSON(built);
        return built;
    }
}
exports.default = V1Addon;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "templateCompilerBabelPlugin", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "root", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "mainModule", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "hasStockTree", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "rootTree", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "moduleName", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "updateBabelConfig", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "v2Trees", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], V1Addon.prototype, "build", null);
class IntermediateBuild {
    constructor() {
        this.trees = [];
        this.staticMeta = {};
        this.dynamicMeta = [];
    }
}
function babelPluginAllowedInStage1(plugin) {
    if ((0, node_1.isEmbroiderMacrosPlugin)(plugin)) {
        // the point of @embroider/macros is that it's allowed to stay in v2
        // addon publication format, so it doesn't need to run here in stage1.
        // We always run it in stage3.
        return false;
    }
    if ((0, detect_babel_plugins_1.isInlinePrecompilePlugin)(plugin)) {
        // Similarly, the inline precompile plugin must not run in stage1. We
        // want all templates uncompiled. Instead, we will be adding our own
        // plugin that only runs custom AST transforms inside inline
        // templates.
        return false;
    }
    if ((0, detect_babel_plugins_1.isEmberAutoImportDynamic)(plugin)) {
        // We replace ember-auto-import's implementation of dynamic import(), so we
        // need to stop its plugin from rewriting those.
        return false;
    }
    if ((0, detect_babel_plugins_1.isCompactReexports)(plugin)) {
        // We don't want to replace re-exports at this stage, since that will turn
        // an `export` statement into a `define`, which is handled in Stage 3
        return false;
    }
    if ((0, detect_babel_plugins_1.isColocationPlugin)(plugin)) {
        // template co-location is a first-class feature we support directly, so
        // whether or not the app brought a plugin for it we're going to do it our
        // way.
        return false;
    }
    return true;
}
function notColocatedTemplate(path) {
    return !/^\.\/components\/.*\.hbs$/.test(path);
}
const markedEmptyTree = new broccoli_source_1.UnwatchedDir(process.cwd());
const stubbedSuper = () => {
    return markedEmptyTree;
};
stubbedSuper.treeFor = () => {
    return markedEmptyTree;
};
//# sourceMappingURL=v1-addon.js.map