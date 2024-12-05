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
exports.Audit = exports.AuditResults = exports.isBuildError = exports.BuildError = void 0;
exports.isRootMarker = isRootMarker;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const core_1 = require("@embroider/core");
const typescript_memoize_1 = require("typescript-memoize");
const chalk_1 = __importDefault(require("chalk"));
const jsdom_1 = __importDefault(require("jsdom"));
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const fromPairs_1 = __importDefault(require("lodash/fromPairs"));
const babel_visitor_1 = require("./audit/babel-visitor");
const build_1 = require("./audit/build");
Object.defineProperty(exports, "BuildError", { enumerable: true, get: function () { return build_1.BuildError; } });
Object.defineProperty(exports, "isBuildError", { enumerable: true, get: function () { return build_1.isBuildError; } });
const { JSDOM } = jsdom_1.default;
function isResolutionFailure(result) {
    return typeof result === 'object' && 'isResolutionFailure' in result;
}
function isResolved(module) {
    return Boolean((module === null || module === void 0 ? void 0 : module.parsed) && module.resolved);
}
function isLinked(module) {
    return Boolean((module === null || module === void 0 ? void 0 : module.parsed) && module.resolved && module.linked);
}
class AuditResults {
    constructor() {
        this.modules = {};
        this.findings = [];
    }
    static create(baseDir, findings, modules) {
        var _a, _b, _c, _d;
        let results = new this();
        for (let [filename, module] of modules) {
            let publicModule = {
                appRelativePath: (0, core_1.explicitRelative)(baseDir, filename),
                consumedFrom: module.consumedFrom.map(entry => {
                    if (isRootMarker(entry)) {
                        return entry;
                    }
                    else {
                        return (0, core_1.explicitRelative)(baseDir, entry);
                    }
                }),
                resolutions: module.resolved
                    ? (0, fromPairs_1.default)([...module.resolved].map(([source, target]) => [
                        source,
                        isResolutionFailure(target) ? null : (0, core_1.explicitRelative)(baseDir, target),
                    ]))
                    : {},
                imports: ((_a = module.parsed) === null || _a === void 0 ? void 0 : _a.imports)
                    ? module.parsed.imports.map(i => ({
                        source: i.source,
                        specifiers: i.specifiers.map(s => ({
                            name: s.name,
                            local: s.local,
                        })),
                    }))
                    : [],
                exports: ((_b = module.linked) === null || _b === void 0 ? void 0 : _b.exports) ? [...module.linked.exports] : [],
                content: ((_c = module.parsed) === null || _c === void 0 ? void 0 : _c.transpiledContent)
                    ? (_d = module.parsed) === null || _d === void 0 ? void 0 : _d.transpiledContent.toString()
                    : 'module failed to transpile',
            };
            results.modules[(0, core_1.explicitRelative)(baseDir, filename)] = publicModule;
        }
        for (let finding of findings) {
            let relFinding = Object.assign({}, finding, { filename: (0, core_1.explicitRelative)(baseDir, finding.filename) });
            results.findings.push(relFinding);
        }
        return results;
    }
    humanReadable() {
        var _a;
        let output = [];
        let findingsByFile = (0, groupBy_1.default)(this.findings, f => f.filename);
        output.push(`=== Audit Results ===`);
        for (let [filename, findings] of Object.entries(findingsByFile)) {
            output.push(`${chalk_1.default.yellow(filename)}`);
            for (let finding of findings) {
                output.push(indent(chalk_1.default.red(finding.message) + ': ' + finding.detail, 1));
                if (finding.codeFrame) {
                    output.push(indent(finding.codeFrame, 2));
                }
            }
            output.push(indent(chalk_1.default.blueBright(`file was included because:`), 1));
            let pointer = filename;
            while (!isRootMarker(pointer)) {
                // the zero here means we only display the first path we found. I think
                // that's a fine tradeoff to keep the output smaller.
                let nextPointer = (_a = this.modules[pointer]) === null || _a === void 0 ? void 0 : _a.consumedFrom[0];
                if (!nextPointer) {
                    output.push(indent(chalk_1.default.red(`couldn't figure out why this was included. Please file a bug against @embroider/compat.`), 2));
                    break;
                }
                if (isRootMarker(nextPointer)) {
                    output.push(indent('packageJSON.ember-addon.assets', 2));
                }
                else {
                    output.push(indent(nextPointer, 2));
                }
                pointer = nextPointer;
            }
        }
        let summaryColor;
        if (this.perfect) {
            summaryColor = chalk_1.default.green;
        }
        else {
            summaryColor = chalk_1.default.yellow;
        }
        output.push(summaryColor(`${this.findings.length} issues found`));
        output.push(`=== End Audit Results ===`);
        output.push(''); // always end with a newline because `yarn run` can overwrite our last line otherwise
        return output.join('\n');
    }
    get perfect() {
        return this.findings.length === 0;
    }
}
exports.AuditResults = AuditResults;
class Audit {
    static async run(options) {
        if (!options['reuse-build']) {
            await (0, build_1.buildApp)(options);
        }
        let audit = new this(options.app, options);
        if (options['reuse-build']) {
            if (!audit.meta.babel.isParallelSafe) {
                throw new build_1.BuildError(`You can't use the ${chalk_1.default.red('--reuse-build')} option because some of your babel or HBS plugins are non-serializable`);
            }
        }
        return audit.run();
    }
    constructor(originAppRoot, options = {}) {
        this.originAppRoot = originAppRoot;
        this.options = options;
        this.modules = new Map();
        this.virtualModules = new Map();
        this.moduleQueue = new Set();
        this.findings = [];
        this.frames = new babel_visitor_1.CodeFrameStorage();
        this.resolver = new core_1.Resolver(this.resolverParams);
    }
    get pkg() {
        return (0, fs_extra_1.readJSONSync)((0, path_1.join)(this.movedAppRoot, 'package.json'));
    }
    get movedAppRoot() {
        let cache = core_1.RewrittenPackageCache.shared('embroider', this.originAppRoot);
        return cache.maybeMoved(cache.get(this.originAppRoot)).root;
    }
    get meta() {
        return this.pkg['ember-addon'];
    }
    get babelConfig() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        let config = require((0, path_1.join)(this.movedAppRoot, this.meta.babel.filename));
        config = Object.assign({}, config);
        config.plugins = config.plugins.filter((p) => !isMacrosPlugin(p));
        config.ast = true;
        return config;
    }
    get resolverParams() {
        return (0, fs_extra_1.readJSONSync)((0, path_1.join)((0, core_1.locateEmbroiderWorkingDir)(this.originAppRoot), 'resolver.json'));
    }
    debug(message, ...args) {
        if (this.options.debug) {
            console.log(message, ...args);
        }
    }
    visitorFor(filename) {
        if (filename.endsWith('.html')) {
            return this.visitHTML;
        }
        else if (filename.endsWith('.hbs')) {
            return this.visitHBS;
        }
        else if (filename.endsWith('.json')) {
            return this.visitJSON;
        }
        else {
            return this.visitJS;
        }
    }
    async drainQueue() {
        while (this.moduleQueue.size > 0) {
            let filename = this.moduleQueue.values().next().value;
            this.moduleQueue.delete(filename);
            this.debug('visit', filename);
            let visitor = this.visitorFor(filename);
            let content;
            if (this.virtualModules.has(filename)) {
                content = this.virtualModules.get(filename);
            }
            else {
                content = (0, fs_extra_1.readFileSync)(filename);
            }
            // cast is safe because the only way to get into the queue is to go
            // through scheduleVisit, and scheduleVisit creates the entry in
            // this.modules.
            let module = this.modules.get(filename);
            let visitResult = await visitor.call(this, filename, content);
            if (Array.isArray(visitResult)) {
                // the visitor was unable to figure out the ParseFields and returned
                // some number of Findings to us to explain why.
                for (let finding of visitResult) {
                    this.pushFinding(finding);
                }
            }
            else {
                module.parsed = visitResult;
                module.resolved = await this.resolveDeps(visitResult.dependencies, filename);
            }
        }
    }
    async run() {
        globalThis.embroider_audit = this.handleResolverError.bind(this);
        try {
            this.debug(`meta`, this.meta);
            for (let asset of this.meta.assets) {
                if (asset.endsWith('.html')) {
                    this.scheduleVisit((0, path_1.resolve)(this.movedAppRoot, asset), { isRoot: true });
                }
            }
            await this.drainQueue();
            this.linkModules();
            this.inspectModules();
            return AuditResults.create(this.originAppRoot, this.findings, this.modules);
        }
        finally {
            delete globalThis.embroider_audit;
        }
    }
    handleResolverError(msg) {
        this.pushFinding({
            message: msg.message,
            filename: msg.filename,
            detail: msg.detail,
            codeFrame: this.frames.render(this.frames.forSource(msg.source)(msg)),
        });
    }
    linkModules() {
        for (let module of this.modules.values()) {
            if (isResolved(module)) {
                this.linkModule(module);
            }
        }
    }
    linkModule(module) {
        let exports = new Set();
        for (let exp of module.parsed.exports) {
            if (typeof exp === 'string') {
                exports.add(exp);
            }
            else {
                let moduleName = module.resolved.get(exp.all);
                if (!isResolutionFailure(moduleName)) {
                    let target = this.modules.get(moduleName);
                    if (!isLinked(target) && isResolved(target)) {
                        this.linkModule(target);
                    }
                    if (isLinked(target)) {
                        for (let innerExp of target.linked.exports) {
                            exports.add(innerExp);
                        }
                    }
                    else {
                        // our module doesn't successfully enter linked state because it
                        // depends on stuff that also couldn't
                        return;
                    }
                }
            }
        }
        module.linked = {
            exports,
        };
    }
    inspectModules() {
        for (let [filename, module] of this.modules) {
            if (isLinked(module)) {
                this.inspectImports(filename, module);
            }
        }
    }
    inspectImports(filename, module) {
        for (let imp of module.parsed.imports) {
            let resolved = module.resolved.get(imp.source);
            if (isResolutionFailure(resolved)) {
                this.findings.push({
                    filename,
                    message: 'unable to resolve dependency',
                    detail: imp.source,
                    codeFrame: this.frames.render(imp.codeFrameIndex),
                });
            }
            else if (resolved) {
                let target = this.modules.get(resolved);
                for (let specifier of imp.specifiers) {
                    if (isLinked(target) && !this.moduleProvidesName(target, specifier.name)) {
                        if (specifier.name === 'default') {
                            let backtick = '`';
                            this.findings.push({
                                filename,
                                message: 'importing a non-existent default export',
                                detail: `"${imp.source}" has no default export. Did you mean ${backtick}import * as ${specifier.local} from "${imp.source}"${backtick}?`,
                                codeFrame: this.frames.render(specifier.codeFrameIndex),
                            });
                        }
                        else {
                            this.findings.push({
                                filename,
                                message: 'importing a non-existent named export',
                                detail: `"${imp.source}" has no export named "${specifier.name}".`,
                                codeFrame: this.frames.render(specifier.codeFrameIndex),
                            });
                        }
                    }
                }
            }
        }
    }
    moduleProvidesName(target, name) {
        // any module can provide a namespace.
        // CJS and AMD are too dynamic to be sure exactly what names are available,
        // so they always get a pass
        return (0, babel_visitor_1.isNamespaceMarker)(name) || target.parsed.isCJS || target.parsed.isAMD || target.linked.exports.has(name);
    }
    async visitHTML(filename, content) {
        let dom = new JSDOM(content);
        let scripts = dom.window.document.querySelectorAll('script[type="module"]');
        let dependencies = [];
        for (let script of scripts) {
            let src = script.src;
            if (!src) {
                continue;
            }
            if (new URL(src, 'http://example.com:4321').origin !== 'http://example.com:4321') {
                // src was absolute, we don't handle it
                continue;
            }
            if (src.startsWith(this.meta['root-url'])) {
                // root-relative URLs are actually relative to the appDir
                src = (0, core_1.explicitRelative)((0, path_1.dirname)(filename), (0, path_1.resolve)(this.movedAppRoot, src.replace(this.meta['root-url'], '')));
            }
            dependencies.push(src);
        }
        return {
            imports: [],
            exports: new Set(),
            isCJS: false,
            isAMD: false,
            dependencies,
            transpiledContent: content,
        };
    }
    async visitJS(filename, content) {
        let rawSource = content.toString('utf8');
        try {
            let result = (0, babel_visitor_1.auditJS)(rawSource, filename, this.babelConfig, this.frames);
            for (let problem of result.problems) {
                this.pushFinding({
                    filename,
                    message: problem.message,
                    detail: problem.detail,
                    codeFrame: this.frames.render(problem.codeFrameIndex),
                });
            }
            return {
                exports: result.exports,
                imports: result.imports,
                isCJS: result.isCJS,
                isAMD: result.isAMD,
                dependencies: result.imports.map(i => i.source),
                transpiledContent: result.transpiledContent,
            };
        }
        catch (err) {
            if (['BABEL_PARSE_ERROR', 'BABEL_TRANSFORM_ERROR'].includes(err.code)) {
                return [
                    {
                        filename,
                        message: `failed to parse`,
                        detail: err.toString().replace(filename, (0, core_1.explicitRelative)(this.originAppRoot, filename)),
                    },
                ];
            }
            else {
                throw err;
            }
        }
    }
    async visitHBS(filename, content) {
        let rawSource = content.toString('utf8');
        let js = (0, core_1.hbsToJS)(rawSource);
        return this.visitJS(filename, js);
    }
    async visitJSON(filename, content) {
        let js;
        try {
            let structure = JSON.parse(content.toString('utf8'));
            js = `export default ${JSON.stringify(structure)}`;
        }
        catch (err) {
            return [
                {
                    filename,
                    message: `failed to parse JSON`,
                    detail: err.toString().replace(filename, (0, core_1.explicitRelative)(this.originAppRoot, filename)),
                },
            ];
        }
        return this.visitJS(filename, js);
    }
    async resolveDeps(deps, fromFile) {
        let resolved = new Map();
        for (let dep of deps) {
            let resolution = await this.resolver.nodeResolve(dep, fromFile);
            switch (resolution.type) {
                case 'virtual':
                    this.virtualModules.set(resolution.filename, resolution.content);
                    resolved.set(dep, resolution.filename);
                    this.scheduleVisit(resolution.filename, fromFile);
                    break;
                case 'not_found':
                    if (['@embroider/macros', '@ember/template-factory'].includes(dep)) {
                        // the audit process deliberately removes the @embroider/macros babel
                        // plugins, so the imports are still present and should be left alone.
                        continue;
                    }
                    resolved.set(dep, { isResolutionFailure: true });
                    break;
                case 'real':
                    resolved.set(dep, resolution.filename);
                    this.scheduleVisit(resolution.filename, fromFile);
                    break;
            }
        }
        return resolved;
    }
    pushFinding(finding) {
        this.findings.push(finding);
    }
    scheduleVisit(filename, parent) {
        let record = this.modules.get(filename);
        if (!record) {
            this.debug(`discovered`, filename);
            record = {
                consumedFrom: [parent],
            };
            this.modules.set(filename, record);
            this.moduleQueue.add(filename);
        }
        else {
            record.consumedFrom.push(parent);
        }
    }
}
exports.Audit = Audit;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], Audit.prototype, "pkg", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], Audit.prototype, "movedAppRoot", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], Audit.prototype, "babelConfig", null);
function isMacrosPlugin(p) {
    return Array.isArray(p) && p[1] && p[1].embroiderMacrosConfigMarker;
}
function indent(str, level) {
    const spacesPerLevel = 2;
    let spaces = '';
    for (let i = 0; i < level * spacesPerLevel; i++) {
        spaces += ' ';
    }
    return str
        .split('\n')
        .map(line => spaces + line)
        .join('\n');
}
function isRootMarker(value) {
    return Boolean(value && typeof value !== 'string' && value.isRoot);
}
//# sourceMappingURL=audit.js.map