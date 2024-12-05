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
const core_1 = require("@embroider/core");
const options_1 = require("./options");
const typescript_memoize_1 = require("typescript-memoize");
const pkg_up_1 = require("pkg-up");
const path_1 = require("path");
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const broccoli_source_1 = require("broccoli-source");
const resolve_1 = __importDefault(require("resolve"));
const v1_config_1 = require("./v1-config");
const v1_appboot_1 = require("./v1-appboot");
const fs_extra_1 = require("fs-extra");
const add_to_tree_1 = __importDefault(require("./add-to-tree"));
const dummy_package_1 = __importDefault(require("./dummy-package"));
const node_1 = require("@embroider/macros/src/node");
const resolve_package_path_1 = __importDefault(require("resolve-package-path"));
const broccoli_concat_1 = __importDefault(require("broccoli-concat"));
const mapKeys_1 = __importDefault(require("lodash/mapKeys"));
const synthesize_template_only_components_1 = __importDefault(require("./synthesize-template-only-components"));
const detect_babel_plugins_1 = require("./detect-babel-plugins");
const prepare_htmlbars_ast_plugins_1 = __importDefault(require("./prepare-htmlbars-ast-plugins"));
const fs_1 = require("fs");
const semver_1 = __importDefault(require("semver"));
const compat_app_builder_1 = require("./compat-app-builder");
// This runs at broccoli-pipeline-construction time, whereas the
// CompatAppBuilder instance only becomes available during tree-building time.
class CompatApp {
    get isDummy() {
        var _a, _b;
        return (_b = (_a = this.legacyEmberAppInstance.project.pkg.keywords) === null || _a === void 0 ? void 0 : _a.includes('ember-addon')) !== null && _b !== void 0 ? _b : false;
    }
    get name() {
        if (this.isDummy) {
            // here we accept the ember-cli behavior
            return this.legacyEmberAppInstance.name;
        }
        else {
            // always the name from package.json. Not the one that apps may have weirdly
            // customized.
            return this.legacyEmberAppInstance.project.pkg.name;
        }
    }
    get env() {
        return this.legacyEmberAppInstance.env;
    }
    get root() {
        if (this.isDummy) {
            // this is the Known Hack for finding the true root of the dummy app.
            return (0, path_1.join)(this.legacyEmberAppInstance.project.configPath(), '..', '..');
        }
        else {
            return (0, path_1.dirname)((0, pkg_up_1.sync)({ cwd: this.legacyEmberAppInstance.project.root }));
        }
    }
    get emberCLILocation() {
        const emberCLIPackage = (0, resolve_package_path_1.default)('ember-cli', this.root);
        if (emberCLIPackage === null) {
            throw new Error(`Embroider: cannot resolve ember-cli's package.json`);
        }
        return (0, path_1.dirname)(emberCLIPackage);
    }
    get hasCompiledStyles() {
        return semver_1.default.gte(JSON.parse((0, fs_1.readFileSync)(`${this.emberCLILocation}/package.json`, 'utf8')).version, '3.18.0');
    }
    requireFromEmberCLI(specifier) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require(resolve_1.default.sync(specifier, { basedir: this.emberCLILocation }));
    }
    get configReplace() {
        return this.requireFromEmberCLI('broccoli-config-replace');
    }
    get configLoader() {
        return this.requireFromEmberCLI('broccoli-config-loader');
    }
    get appUtils() {
        return this.requireFromEmberCLI('./lib/utilities/ember-app-utils');
    }
    get addonTreeCache() {
        return new Map();
    }
    get preprocessRegistry() {
        return this.requireFromEmberCLI('ember-cli-preprocess-registry/preprocessors');
    }
    get shouldBuildTests() {
        return this.legacyEmberAppInstance.tests || false;
    }
    configPath() {
        return this.legacyEmberAppInstance.project.configPath();
    }
    get configTree() {
        return new this.configLoader((0, path_1.dirname)(this.configPath()), {
            env: this.legacyEmberAppInstance.env,
            tests: this.legacyEmberAppInstance.tests || false,
            project: this.legacyEmberAppInstance.project,
        });
    }
    get config() {
        return new v1_config_1.V1Config(this.configTree, this.legacyEmberAppInstance.env);
    }
    get testConfig() {
        if (this.shouldBuildTests) {
            return new v1_config_1.V1Config(this.configTree, 'test');
        }
    }
    get autoRun() {
        return this.legacyEmberAppInstance.options.autoRun;
    }
    get appBoot() {
        let env = this.legacyEmberAppInstance.env;
        let appBootContentTree = new v1_appboot_1.WriteV1AppBoot();
        let patterns = this.configReplacePatterns;
        appBootContentTree = new this.configReplace(appBootContentTree, this.configTree, {
            configPath: (0, path_1.join)('environments', `${env}.json`),
            files: ['config/app-boot.js'],
            patterns,
        });
        return new v1_appboot_1.ReadV1AppBoot(appBootContentTree);
    }
    get storeConfigInMeta() {
        return this.legacyEmberAppInstance.options.storeConfigInMeta;
    }
    get configReplacePatterns() {
        return this.appUtils.configReplacePatterns({
            addons: this.legacyEmberAppInstance.project.addons,
            autoRun: this.autoRun,
            storeConfigInMeta: this.storeConfigInMeta,
        });
    }
    get htmlTree() {
        if (this.legacyEmberAppInstance.tests) {
            return (0, broccoli_merge_trees_1.default)([this.indexTree, this.testIndexTree]);
        }
        else {
            return this.indexTree;
        }
    }
    get indexTree() {
        let indexFilePath = this.legacyEmberAppInstance.options.outputPaths.app.html;
        let index = (0, broccoli_funnel_1.default)(this.legacyEmberAppInstance.trees.app, {
            allowEmpty: true,
            include: [`index.html`],
            getDestinationPath: () => indexFilePath,
            annotation: 'app/index.html',
        });
        return new this.configReplace(index, this.configTree, {
            configPath: (0, path_1.join)('environments', `${this.legacyEmberAppInstance.env}.json`),
            files: [indexFilePath],
            patterns: this.configReplacePatterns,
            annotation: 'ConfigReplace/indexTree',
        });
    }
    get testIndexTree() {
        let index = (0, broccoli_funnel_1.default)(this.legacyEmberAppInstance.trees.tests, {
            allowEmpty: true,
            include: [`index.html`],
            destDir: 'tests',
            annotation: 'tests/index.html',
        });
        return new this.configReplace(index, this.configTree, {
            configPath: (0, path_1.join)('environments', `test.json`),
            files: ['tests/index.html'],
            patterns: this.configReplacePatterns,
            annotation: 'ConfigReplace/testIndexTree',
        });
    }
    babelConfig() {
        // this finds all the built-in babel configuration that comes with ember-cli-babel
        const babelAddon = this.legacyEmberAppInstance.project.findAddonByName('ember-cli-babel');
        const babelConfig = babelAddon.buildBabelOptions({
            'ember-cli-babel': {
                ...this.legacyEmberAppInstance.options['ember-cli-babel'],
                includeExternalHelpers: true,
                compileModules: false,
                disableDebugTooling: false,
                disablePresetEnv: false,
                disableEmberModulesAPIPolyfill: false,
            },
        });
        let plugins = babelConfig.plugins;
        let presets = babelConfig.presets;
        // this finds any custom babel configuration that's on the app (either
        // because the app author explicitly added some, or because addons have
        // pushed plugins into it).
        let appBabel = this.legacyEmberAppInstance.options.babel;
        if (appBabel) {
            if (appBabel.plugins) {
                plugins = appBabel.plugins.concat(plugins);
            }
            if (appBabel.presets) {
                presets = appBabel.presets.concat(presets);
            }
        }
        plugins = plugins.filter(p => {
            // even if the app was using @embroider/macros, we drop it from the config
            // here in favor of our globally-configured one.
            return (!(0, node_1.isEmbroiderMacrosPlugin)(p) &&
                // similarly, if the app was already using an inline template compiler
                // babel plugin, we remove it here because we have our own
                // always-installed version of that (v2 addons are allowed to assume it
                // will be present in the final app build, the app doesn't get to turn
                // that off or configure it.)
                !(0, detect_babel_plugins_1.isInlinePrecompilePlugin)(p) &&
                !(0, detect_babel_plugins_1.isEmberAutoImportDynamic)(p));
        });
        const config = {
            babelrc: false,
            plugins,
            presets,
            // this is here because broccoli-middleware can't render a codeFrame full
            // of terminal codes. It would be nice to add something like
            // https://github.com/mmalecki/ansispan to broccoli-middleware so we can
            // leave color enabled.
            highlightCode: false,
        };
        return config;
    }
    babelMajorVersion() {
        var _a, _b;
        let babelAddon = this.legacyEmberAppInstance.project.addons.find((a) => a.name === 'ember-cli-babel');
        if (babelAddon) {
            let babelAddonMajor = Number(babelAddon.pkg.version.split('.')[0]);
            let babelMajor = babelAddonMajor;
            if (babelAddonMajor >= 8) {
                // `ember-cli-babel` v8 breaks lockstep with Babel, because it now
                // defines `@babel/core` as a peer dependency, so we need to check the
                // project's version of `@babel/core`:
                let babelVersion = (_a = this.legacyEmberAppInstance.project.pkg.devDependencies) === null || _a === void 0 ? void 0 : _a['@babel/core'];
                if (babelVersion) {
                    babelMajor = (_b = semver_1.default.coerce(babelVersion)) === null || _b === void 0 ? void 0 : _b.major;
                }
                else {
                    babelMajor = 7;
                }
            }
            if (babelMajor !== 7) {
                throw new Error('`@embroider/compat` only supports apps and addons that use Babel v7.');
            }
            return babelMajor;
        }
        // if we didn't have our own babel plugin at all, it's safe to parse our
        // code with 7.
        return 7;
    }
    transformedNodeFiles() {
        // any app.imports from node_modules that need custom transforms will need
        // to get copied into our own synthesized vendor package. app.imports from
        // node_modules that *don't* need custom transforms can just stay where they
        // are.
        let transformed = new Map();
        for (let transformConfig of this.legacyEmberAppInstance._customTransformsMap.values()) {
            for (let filename of transformConfig.files) {
                let preresolved = this.preresolvedNodeFile(filename);
                if (preresolved) {
                    transformed.set(filename, preresolved);
                }
            }
        }
        return transformed;
    }
    preresolvedNodeFile(filename) {
        // this regex is an exact copy of how ember-cli does this, so we align.
        let match = filename.match(/^node_modules\/((@[^/]+\/)?[^/]+)\//);
        if (match) {
            // ember-cli has already done its own resolution of
            // `app.import('node_modules/something/...')`, so we go find its answer.
            for (let { name, path } of this.legacyEmberAppInstance._nodeModules.values()) {
                if (match[1] === name) {
                    return filename.replace(match[0], path + path_1.sep);
                }
            }
            throw new Error(`bug: expected ember-cli to already have a resolved path for asset ${filename}`);
        }
    }
    combinedVendor(addonTrees) {
        let trees = addonTrees.map(tree => (0, broccoli_funnel_1.default)(tree, {
            allowEmpty: true,
            srcDir: 'vendor',
            destDir: 'vendor',
        }));
        if (this.vendorTree) {
            trees.push((0, broccoli_funnel_1.default)(this.vendorTree, {
                destDir: 'vendor',
            }));
        }
        const tree = (0, broccoli_merge_trees_1.default)(trees, { overwrite: true });
        const outputGroups = [
            // scripts
            {
                outputFiles: this.legacyEmberAppInstance._scriptOutputFiles,
                implicitKey: '_implicitScripts',
                vendorOutputPath: this.legacyEmberAppInstance.options.outputPaths.vendor.js,
            },
            // styles
            {
                outputFiles: this.legacyEmberAppInstance._styleOutputFiles,
                implicitKey: '_implicitStyles',
                vendorOutputPath: this.legacyEmberAppInstance.options.outputPaths.vendor.css,
            },
        ];
        const concatentations = [];
        // support: app.import / outputFile / using
        for (let entry of outputGroups) {
            const { outputFiles, implicitKey, vendorOutputPath } = entry;
            for (let importPath of Object.keys(outputFiles)) {
                const headerFiles = outputFiles[importPath];
                if (importPath === vendorOutputPath) {
                    // these are the default ember-cli output files vendor.js or
                    // vendor.css. Let embroider handle these.
                    this[implicitKey] = headerFiles;
                }
                else if (headerFiles.length === 0) {
                    // something went really wrong, open an issue
                    throw new Error('Embroider: EWUT');
                }
                else if (headerFiles.length === 1) {
                    // app.import(x, { outputFile: y }); where only one app.imports had this outputFile
                    //
                    // No concat needed. Simply serialize the remapping in the addon's
                    // manifest, this ensures it is included in the final output with no extra work.
                    this._publicAssets[headerFiles[0]] = importPath;
                }
                else {
                    // app.import(x, { outputFile: y }); where multiple app.imports share one outputFile
                    // Concat needed. Perform concat, and include the outputFile in the
                    // addon's manifest. This ensures it is included in the final output
                    this._publicAssets[importPath] = importPath;
                    concatentations.push(new broccoli_concat_1.default(tree, {
                        headerFiles,
                        outputFile: importPath,
                        annotation: `Package ${importPath}`,
                        separator: '\n;',
                        sourceMapConfig: this.legacyEmberAppInstance.options['sourcemaps'],
                    }));
                }
            }
        }
        this.addOtherAssets();
        return (0, broccoli_merge_trees_1.default)([tree, ...concatentations], { overwrite: true });
    }
    addOtherAssets() {
        for (let asset of this.legacyEmberAppInstance.otherAssetPaths) {
            this._publicAssets[`${asset.src}/${asset.file}`] = `${asset.dest}/${asset.file}`;
        }
    }
    addNodeAssets(inputTree) {
        let transformedNodeFiles = this.transformedNodeFiles();
        return new add_to_tree_1.default(inputTree, outputPath => {
            for (let [localDestPath, sourcePath] of transformedNodeFiles) {
                let destPath = (0, path_1.join)(outputPath, localDestPath);
                (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(destPath));
                (0, fs_extra_1.copySync)(sourcePath, destPath);
            }
            let remapAsset = this.remapAsset.bind(this);
            let addonMeta = {
                type: 'addon',
                version: 2,
                'implicit-scripts': this._implicitScripts.map(remapAsset),
                'implicit-styles': this._implicitStyles.map(remapAsset),
                'implicit-test-scripts': this.legacyEmberAppInstance.legacyTestFilesToAppend.map(remapAsset),
                'implicit-test-styles': this.legacyEmberAppInstance.vendorTestStaticStyles.map(remapAsset),
                'public-assets': (0, mapKeys_1.default)(this._publicAssets, (_, key) => remapAsset(key)),
            };
            let meta = {
                name: '@embroider/synthesized-vendor',
                version: '0.0.0',
                keywords: ['ember-addon'],
                'ember-addon': addonMeta,
            };
            (0, fs_extra_1.writeJSONSync)((0, path_1.join)(outputPath, 'package.json'), meta, { spaces: 2 });
        });
    }
    synthesizeVendorPackage(addonTrees) {
        return this.applyCustomTransforms(this.addNodeAssets(this.combinedVendor(addonTrees)));
    }
    combinedStyles(addonTrees) {
        let trees = addonTrees.map(tree => (0, broccoli_funnel_1.default)(tree, {
            allowEmpty: true,
            srcDir: '_app_styles_',
        }));
        let appStyles = this.legacyEmberAppInstance.trees.styles;
        if (appStyles) {
            // Workaround for https://github.com/ember-cli/ember-cli/issues/9020
            //
            // The default app styles tree is unwatched and relies on side effects
            // elsewhere in ember-cli's build pipeline to actually get rebuilds to
            // work. Here we need it to actually be watched properly if we want to
            // rely on it, particularly when using BROCCOLI_ENABLED_MEMOIZE.
            if (appStyles._watched === false && appStyles._directoryPath) {
                appStyles = new broccoli_source_1.WatchedDir(appStyles._directoryPath);
            }
            trees.push(appStyles);
        }
        return (0, broccoli_merge_trees_1.default)(trees, { overwrite: true, annotation: 'embroider-v1-app-combined-styles' });
    }
    synthesizeStylesPackage(addonTrees) {
        let options = {
            // we're deliberately not allowing this to be customized. It's an
            // internal implementation detail, and respecting outputPaths here is
            // unnecessary complexity. The corresponding code that adjusts the HTML
            // <link> is in updateHTML in app.ts.
            outputPaths: { app: `/assets/${this.name}.css` },
            registry: this.legacyEmberAppInstance.registry,
            minifyCSS: this.legacyEmberAppInstance.options.minifyCSS.options,
        };
        let nestedInput = (0, broccoli_funnel_1.default)(this.combinedStyles(addonTrees), { destDir: 'app/styles' });
        let styles = this.preprocessors.preprocessCss(nestedInput, '/app/styles', '/assets', options);
        return new add_to_tree_1.default(styles, outputPath => {
            let addonMeta = {
                type: 'addon',
                version: 2,
                'public-assets': {},
            };
            let assetPath = (0, path_1.join)(outputPath, 'assets');
            if ((0, fs_extra_1.pathExistsSync)(assetPath)) {
                for (let file of (0, fs_extra_1.readdirSync)(assetPath)) {
                    addonMeta['public-assets'][`./assets/${file}`] = `/assets/${file}`;
                }
            }
            let meta = {
                name: '@embroider/synthesized-styles',
                version: '0.0.0',
                keywords: ['ember-addon'],
                'ember-addon': addonMeta,
            };
            (0, fs_extra_1.writeJSONSync)((0, path_1.join)(outputPath, 'package.json'), meta, { spaces: 2 });
        });
    }
    // this is taken nearly verbatim from ember-cli.
    applyCustomTransforms(externalTree) {
        for (let customTransformEntry of this.legacyEmberAppInstance._customTransformsMap) {
            let transformName = customTransformEntry[0];
            let transformConfig = customTransformEntry[1];
            let transformTree = (0, broccoli_funnel_1.default)(externalTree, {
                files: transformConfig.files,
                annotation: `Funnel (custom transform: ${transformName})`,
            });
            externalTree = (0, broccoli_merge_trees_1.default)([externalTree, transformConfig.callback(transformTree, transformConfig.options)], {
                annotation: `TreeMerger (custom transform: ${transformName})`,
                overwrite: true,
            });
        }
        return externalTree;
    }
    remapAsset(asset) {
        if (this.transformedNodeFiles().has(asset)) {
            // transformed node assets become local paths, because we have copied
            // those ones into our synthesized vendor package.
            return './' + asset;
        }
        let preresolved = this.preresolvedNodeFile(asset);
        if (preresolved) {
            // non-transformed node assets point directly at their pre-resolved
            // original files (this is an absolute path).
            return preresolved;
        }
        // non node assets are local paths. They need an explicit `/` or `.` at
        // the start.
        if (asset.startsWith('.') || (0, path_1.isAbsolute)(asset)) {
            return asset;
        }
        return './' + asset;
    }
    preprocessJS(tree) {
        // we're saving all our babel compilation for the final stage packager
        this.legacyEmberAppInstance.registry.remove('js', 'ember-cli-babel');
        // auto-import is supported natively so we don't need it here
        this.legacyEmberAppInstance.registry.remove('js', 'ember-auto-import-analyzer');
        tree = (0, broccoli_funnel_1.default)(tree, { destDir: this.name });
        tree = this.preprocessors.preprocessJs(tree, `/`, '/', {
            annotation: 'v1-app-preprocess-js',
            registry: this.legacyEmberAppInstance.registry,
        });
        tree = (0, broccoli_funnel_1.default)(tree, { srcDir: this.name });
        return tree;
    }
    get htmlbarsPlugins() {
        let plugins = (0, prepare_htmlbars_ast_plugins_1.default)(this.legacyEmberAppInstance.registry);
        // even if the app was using @embroider/macros, we drop it from the config
        // here in favor of our globally-configured one.
        plugins = plugins.filter((p) => !(0, node_1.isEmbroiderMacrosPlugin)(p));
        return plugins;
    }
    // our own appTree. Not to be confused with the one that combines the app js
    // from all addons too.
    get appTree() {
        return this.preprocessJS((0, broccoli_funnel_1.default)(this.legacyEmberAppInstance.trees.app, {
            exclude: ['styles/**', '*.html'],
        }));
    }
    get testsTree() {
        if (this.shouldBuildTests && this.legacyEmberAppInstance.trees.tests) {
            return this.preprocessJS((0, broccoli_funnel_1.default)(this.legacyEmberAppInstance.trees.tests, {
                destDir: 'tests',
            }));
        }
    }
    get lintTree() {
        if (this.shouldBuildTests) {
            return this.legacyEmberAppInstance.getLintTests();
        }
    }
    get vendorTree() {
        return this.ensureTree(this.legacyEmberAppInstance.trees.vendor);
    }
    ensureTree(maybeTree) {
        if (typeof maybeTree === 'string') {
            // this is deliberately mimicking how ember-cli does it. We don't use
            // `this.root` on purpose, because that can differ from what ember-cli
            // considers the project.root. And we don't use path.resolve even though
            // that seems possibly more correct, because ember-cli always assumes the
            // input is relative.
            let resolvedPath = (0, path_1.join)(this.legacyEmberAppInstance.project.root, maybeTree);
            if ((0, fs_extra_1.existsSync)(resolvedPath)) {
                return new broccoli_source_1.WatchedDir(maybeTree);
            }
            else {
                return undefined;
            }
        }
        return maybeTree;
    }
    get preprocessors() {
        return this.requireFromEmberCLI('ember-cli-preprocess-registry/preprocessors');
    }
    get publicTree() {
        return this.ensureTree(this.legacyEmberAppInstance.trees.public);
    }
    processAppJS() {
        let appTree = this.appTree;
        let testsTree = this.testsTree;
        let lintTree = this.lintTree;
        let config = new v1_config_1.WriteV1Config(this.config, this.storeConfigInMeta, this.testConfig);
        let patterns = this.configReplacePatterns;
        let configReplaced = new this.configReplace(config, this.configTree, {
            configPath: (0, path_1.join)('environments', `${this.legacyEmberAppInstance.env}.json`),
            files: ['config/environment.js'],
            patterns,
        });
        let trees = [];
        trees.push(appTree);
        trees.push(new synthesize_template_only_components_1.default(appTree, { allowedPaths: ['components'], templateExtensions: ['.hbs'] }));
        trees.push(configReplaced);
        if (testsTree) {
            trees.push(testsTree);
        }
        if (lintTree) {
            trees.push(lintTree);
        }
        return {
            appJS: (0, broccoli_merge_trees_1.default)(trees, { overwrite: true }),
        };
    }
    withoutRootURL(src) {
        let rootURL = this.config.readConfig().rootURL;
        if ((src.startsWith(rootURL) && rootURL) || (!rootURL && !src.startsWith('/'))) {
            src = '/' + src.slice(rootURL.length);
        }
        else if (src.startsWith('/' + rootURL)) {
            src = src.slice(rootURL.length);
        }
        return src;
    }
    findAppScript(scripts, entrypoint) {
        let appJS = scripts.find(script => this.withoutRootURL(script.src) === this.legacyEmberAppInstance.options.outputPaths.app.js);
        return throwIfMissing(appJS, this.legacyEmberAppInstance.options.outputPaths.app.js, scripts.map(s => s.src), entrypoint, 'app javascript');
    }
    findAppStyles(styles, entrypoint) {
        let style = styles.find(style => this.withoutRootURL(style.href) === this.legacyEmberAppInstance.options.outputPaths.app.css.app);
        return throwIfMissing(style, this.legacyEmberAppInstance.options.outputPaths.app.css.app, styles.map(s => s.href), entrypoint, 'app css');
    }
    findVendorScript(scripts, entrypoint) {
        let vendor = scripts.find(script => this.withoutRootURL(script.src) === this.legacyEmberAppInstance.options.outputPaths.vendor.js);
        return throwIfMissing(vendor, this.legacyEmberAppInstance.options.outputPaths.vendor.js, scripts.map(s => s.src), entrypoint, 'vendor javascript');
    }
    findVendorStyles(styles, entrypoint) {
        let vendorStyle = styles.find(style => this.withoutRootURL(style.href) === this.legacyEmberAppInstance.options.outputPaths.vendor.css);
        return throwIfMissing(vendorStyle, this.legacyEmberAppInstance.options.outputPaths.vendor.css, styles.map(s => s.href), entrypoint, 'vendor css');
    }
    findTestSupportStyles(styles) {
        return styles.find(style => this.withoutRootURL(style.href) === this.legacyEmberAppInstance.options.outputPaths.testSupport.css);
    }
    findTestSupportScript(scripts) {
        return scripts.find(script => this.withoutRootURL(script.src) === this.legacyEmberAppInstance.options.outputPaths.testSupport.js.testSupport);
    }
    findTestScript(scripts) {
        return scripts.find(script => this.withoutRootURL(script.src) === this.legacyEmberAppInstance.options.outputPaths.tests.js);
    }
    constructor(legacyEmberAppInstance, _options) {
        this.legacyEmberAppInstance = legacyEmberAppInstance;
        this.annotation = '@embroider/compat/app';
        this._publicAssets = Object.create(null);
        this._implicitScripts = [];
        this._implicitStyles = [];
        this.options = (0, options_1.optionsWithDefaults)(_options);
        this.macrosConfig = node_1.MacrosConfig.for(legacyEmberAppInstance, this.root);
        if (this.env !== 'production') {
            this.macrosConfig.enablePackageDevelopment(this.root);
            this.macrosConfig.enableRuntimeMode();
            if (this.isDummy) {
                // dummy apps automatically put their owning addon under development too
                this.macrosConfig.enablePackageDevelopment((0, path_1.dirname)((0, pkg_up_1.sync)({ cwd: this.legacyEmberAppInstance.project.root })));
            }
        }
        // this uses globalConfig because it's a way for packages to ask "is
        // Embroider doing this build?". So it's necessarily global, not scoped to
        // any subgraph of dependencies.
        this.macrosConfig.setGlobalConfig(__filename, `@embroider/core`, {
            // this is hard-coded to true because it literally means "embroider is
            // building this Ember app". You can see non-true when using the Embroider
            // macros in a classic build.
            active: true,
        });
    }
    inTrees(prevStageTree) {
        let publicTree = this.publicTree;
        let configTree = this.config;
        if (this.options.extraPublicTrees.length > 0) {
            publicTree = (0, broccoli_merge_trees_1.default)([publicTree, ...this.options.extraPublicTrees].filter(Boolean));
        }
        return {
            appJS: this.processAppJS().appJS,
            htmlTree: this.htmlTree,
            publicTree,
            configTree,
            appBootTree: this.appBoot,
            prevStageTree,
        };
    }
    appPackage() {
        // this is deliberately not RewrittenPackageCache, because it's supposed to
        // be the original copy of the app with all the original dependencies.
        let packageCache = core_1.PackageCache.shared('embroider', this.root);
        if (this.isDummy) {
            return new dummy_package_1.default(this.root, this.legacyEmberAppInstance.project.root, packageCache // TODO: cast won't be needed when refactor is complete
            );
        }
        else {
            return packageCache.get(this.root);
        }
    }
    async instantiate(root, packageCache, configTree) {
        let origAppPkg = this.appPackage();
        let movedAppPkg = packageCache.withRewrittenDeps(origAppPkg);
        let workingDir = (0, core_1.locateEmbroiderWorkingDir)(this.root);
        return new compat_app_builder_1.CompatAppBuilder(root, origAppPkg, movedAppPkg, this.options, this, configTree, packageCache.get((0, path_1.join)(workingDir, 'rewritten-packages', '@embroider', 'synthesized-vendor')), packageCache.get((0, path_1.join)(workingDir, 'rewritten-packages', '@embroider', 'synthesized-styles')));
    }
    asStage(prevStage) {
        let resolve;
        let promise = new Promise(r => (resolve = r));
        let tree = () => {
            let inTrees = this.inTrees(prevStage.tree);
            return new core_1.WaitForTrees(inTrees, this.annotation, async (treePaths) => {
                if (!this.active) {
                    let { outputPath } = await prevStage.ready();
                    let packageCache = core_1.RewrittenPackageCache.shared('embroider', this.root);
                    this.active = await this.instantiate(outputPath, packageCache, inTrees.configTree);
                    resolve({ outputPath });
                }
                await this.active.build(treePaths);
            });
        };
        return {
            get inputPath() {
                return prevStage.inputPath;
            },
            ready: async () => {
                return await promise;
            },
            get tree() {
                return tree();
            },
        };
    }
}
exports.default = CompatApp;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "root", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "emberCLILocation", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "hasCompiledStyles", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "addonTreeCache", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "preprocessRegistry", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "config", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "testConfig", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "appBoot", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "configReplacePatterns", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "babelConfig", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "babelMajorVersion", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "transformedNodeFiles", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "preprocessors", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], CompatApp.prototype, "appPackage", null);
function throwIfMissing(asset, needle, haystack, entryfile, context) {
    if (!asset) {
        throw new Error(`Could not find ${context}: "${needle}" in ${entryfile}. Found the following instead:\n${haystack
            .map(asset => ` - ${asset}`)
            .join('\n')}\n\nFor more information about this error: https://github.com/thoov/stitch/wiki/Could-not-find-asset-in-entry-file-error-help`);
    }
    return asset;
}
//# sourceMappingURL=compat-app.js.map