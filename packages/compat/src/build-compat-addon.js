"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildCompatAddon;
const smoosh_package_json_1 = __importDefault(require("./smoosh-package-json"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const empty_package_tree_1 = __importDefault(require("./empty-package-tree"));
function buildCompatAddon(originalPackage, v1Cache) {
    if (originalPackage.isV2Addon()) {
        throw new Error(`bug in @embroider/compat. We should not see any v2 addons here, but ${originalPackage.name} as ${originalPackage.root} is a v2 addon`);
    }
    let oldPackages = v1Cache.getAddons(originalPackage.root);
    if (oldPackages.length > 1) {
        // extensibility hook that allows a compat adapter to optimize its own
        // smooshing. We do it early so that if it reduces all the way to zero, the
        // next check will handle that.
        oldPackages = oldPackages[0].reduceInstances(oldPackages);
    }
    if (oldPackages.length === 0) {
        // this happens when the v1 addon wasn't actually getting instantiated at
        // all, which can happen if the app uses `addons.blacklist` or another addon
        // uses `shouldIncludeChildAddon`.
        //
        // we still keep a place for this addon in the rewritten addon workspace,
        // because that whole process only depends on looking at all the
        // package.json files on disk -- it can't know which ones are going to end
        // up unused at this point.
        return new empty_package_tree_1.default(originalPackage);
    }
    let needsSmooshing = oldPackages.length > 1 && oldPackages[0].hasAnyTrees();
    if (needsSmooshing) {
        let trees = oldPackages.map(pkg => pkg.v2Tree).reverse();
        let smoosher = new smoosh_package_json_1.default(trees, { annotation: originalPackage.name });
        return (0, broccoli_merge_trees_1.default)([...trees, smoosher], { overwrite: true });
    }
    else {
        return oldPackages[0].v2Tree;
    }
}
//# sourceMappingURL=build-compat-addon.js.map