"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessComponentRule = preprocessComponentRule;
exports.activePackageRules = activePackageRules;
exports.appTreeRulesDir = appTreeRulesDir;
const core_1 = require("@embroider/core");
const path_1 = require("path");
const semver_1 = require("semver");
// take a component rule from the authoring format to a format more optimized
// for consumption in the resolver
function preprocessComponentRule(componentRules) {
    var _a;
    let argumentsAreComponents = [];
    let safeInteriorPaths = [];
    if (componentRules.acceptsComponentArguments) {
        for (let entry of componentRules.acceptsComponentArguments) {
            let name, interior;
            if (typeof entry === 'string') {
                name = interior = entry;
            }
            else {
                name = entry.name;
                interior = entry.becomes;
            }
            if (name.startsWith('@')) {
                name = name.slice(1);
            }
            argumentsAreComponents.push(name);
            safeInteriorPaths.push(interior);
            safeInteriorPaths.push('this.' + interior);
            safeInteriorPaths.push('@' + name);
        }
    }
    if (componentRules.invokes) {
        for (let [path] of Object.entries(componentRules.invokes)) {
            safeInteriorPaths.push(path);
        }
    }
    return {
        safeInteriorPaths,
        safeToIgnore: Boolean(componentRules.safeToIgnore),
        argumentsAreComponents,
        yieldsSafeComponents: componentRules.yieldsSafeComponents || [],
        yieldsArguments: componentRules.yieldsArguments || [],
        disambiguate: (_a = componentRules === null || componentRules === void 0 ? void 0 : componentRules.disambiguate) !== null && _a !== void 0 ? _a : {},
    };
}
function activePackageRules(packageRules, activePackages) {
    // rule order implies precedence. The first rule that matches a given package
    // applies to that package, and no other rule does.
    let rootsPerRule = new Map();
    for (let pkg of activePackages) {
        for (let rule of packageRules) {
            if (rule.package === pkg.name && (!rule.semverRange || (0, semver_1.satisfies)(pkg.version, rule.semverRange))) {
                let roots = (0, core_1.getOrCreate)(rootsPerRule, rule, () => []);
                roots.push(pkg.root);
                break;
            }
        }
    }
    let output = [];
    for (let [rule, roots] of rootsPerRule) {
        output.push(Object.assign({ roots }, rule));
    }
    return output;
}
function appTreeRulesDir(root, resolver) {
    let pkg = resolver.packageCache.ownerOfFile(root);
    if (pkg === null || pkg === void 0 ? void 0 : pkg.isV2Addon()) {
        // in general v2 addons can keep their app tree stuff in other places than
        // "_app_" and we would need to check their package.json to see. But this code
        // is only for applying packageRules to auto-upgraded v1 addons and apps, and
        // those we always organize predictably.
        return (0, path_1.resolve)(root, '_app_');
    }
    else {
        // auto-upgraded apps don't get an exist _app_ dir.
        return root;
    }
}
//# sourceMappingURL=dependency-rules.js.map