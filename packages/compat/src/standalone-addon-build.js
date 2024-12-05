"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLegacyAddons = convertLegacyAddons;
const core_1 = require("@embroider/core");
const v1_instance_cache_1 = __importDefault(require("./v1-instance-cache"));
const build_compat_addon_1 = __importDefault(require("./build-compat-addon"));
const broccoli_funnel_1 = require("broccoli-funnel");
const crypto_1 = __importDefault(require("crypto"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const broccoli_file_creator_1 = __importDefault(require("broccoli-file-creator"));
const path_1 = require("path");
function convertLegacyAddons(compatApp) {
    let packageCache = core_1.PackageCache.shared('embroider', compatApp.root);
    let instanceCache = new v1_instance_cache_1.default(compatApp, packageCache);
    let appPackage = compatApp.appPackage();
    let violations = (0, core_1.validatePeerDependencies)(appPackage).filter(({ dep }) => dep.isEmberPackage() && !dep.isV2Ember());
    if (violations.length > 0) {
        if (process.env.I_HAVE_BAD_PEER_DEPS_AND_WANT_A_BROKEN_BUILD) {
            console.warn(`You have set process.env.I_HAVE_BAD_PEER_DEPS_AND_WANT_A_BROKEN_BUILD, so we're ignoring your broken peer deps. Please don't bother reporting any Embroider bugs until you unset it.\n${(0, core_1.summarizePeerDepViolations)(violations)}`);
        }
        else {
            throw new Error(`Some V1 ember addons are resolving as incorrect peer dependencies. This makes it impossible for us to safely convert them to v2 format.

  👇 👇 👇
👉 See https://github.com/embroider-build/embroider/blob/main/docs/peer-dependency-resolution-issues.md for an explanation of the problem and suggestions for fixing it.
  👆 👆 👆

${(0, core_1.summarizePeerDepViolations)(violations)}

  👇 👇 👇
👉 See https://github.com/embroider-build/embroider/blob/main/docs/peer-dependency-resolution-issues.md for an explanation of the problem and suggestions for fixing it.
  👆 👆 👆`);
        }
    }
    let v1Addons = findV1Addons(appPackage);
    let index = buildAddonIndex(compatApp, appPackage, v1Addons);
    let interiorTrees = [];
    let exteriorTrees = [...v1Addons].map(pkg => {
        let interior = (0, build_compat_addon_1.default)(pkg, instanceCache);
        interiorTrees.push(interior);
        return new broccoli_funnel_1.Funnel(interior, { destDir: index.packages[pkg.root] });
    });
    let fakeTargets = Object.values(index.packages).map(dir => {
        let segments = dir.split('/');
        while (segments[segments.length - 1] && segments[segments.length - 1] !== 'node_modules') {
            segments.pop();
        }
        segments.push('moved-package-target.js');
        return (0, broccoli_file_creator_1.default)((0, path_1.join)(...segments), '');
    });
    return (0, broccoli_merge_trees_1.default)([
        ...exteriorTrees,
        new broccoli_funnel_1.Funnel(compatApp.synthesizeStylesPackage(interiorTrees), {
            destDir: '@embroider/synthesized-styles',
        }),
        new broccoli_funnel_1.Funnel(compatApp.synthesizeVendorPackage(interiorTrees), {
            destDir: '@embroider/synthesized-vendor',
        }),
        (0, broccoli_file_creator_1.default)('index.json', JSON.stringify(index, null, 2)),
        ...fakeTargets,
    ]);
}
function buildAddonIndex(compatApp, appPackage, packages) {
    let content = {
        packages: {},
        extraResolutions: {},
    };
    for (let oldPkg of packages) {
        let newRoot = `${oldPkg.name}.${hashed(oldPkg.root)}/node_modules/${oldPkg.name}`;
        content.packages[oldPkg.root] = newRoot;
        let nonResolvableDeps = oldPkg.nonResolvableDeps;
        if (nonResolvableDeps) {
            content.extraResolutions[newRoot] = [...nonResolvableDeps.values()].map(v => v.root);
        }
    }
    // adding an entry for the app itself to have a place in the
    // rewritten-packages, even though this stage hasn't actually put it there
    // yet. This directory lives outside our rewritten-pacakges directory because
    // it's produced by a separate build stage, and it's easier to have them
    // writing into separate directories.
    content.packages[compatApp.root] = (0, path_1.join)('..', 'rewritten-app');
    let nonResolvableDeps = appPackage.nonResolvableDeps;
    if (nonResolvableDeps) {
        let extraRoots = [...nonResolvableDeps.values()].map(v => v.root);
        // the app gets extraResolutions support just like every addon does
        content.extraResolutions[(0, path_1.join)('..', 'rewritten-app')] = extraRoots;
        // but it also gets extraResolutions registered against its *original*
        // location, because the app is unique because stage2 needs a Package
        // representing the *unmoved* app but seeing *moved* deps.
        content.extraResolutions[appPackage.root] = extraRoots;
    }
    return content;
}
function findV1Addons(pkg, seen = new Set(), output = new Set()) {
    for (let dep of pkg.dependencies) {
        if (seen.has(dep)) {
            continue;
        }
        seen.add(dep);
        if (dep.isEmberPackage()) {
            if (!dep.isV2Addon()) {
                output.add(dep);
            }
            findV1Addons(dep, seen, output);
        }
    }
    return output;
}
function hashed(path) {
    let h = crypto_1.default.createHash('sha1');
    return h.update(path).digest('hex').slice(0, 8);
}
//# sourceMappingURL=standalone-addon-build.js.map