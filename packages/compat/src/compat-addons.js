"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const core_1 = require("@embroider/core");
const tree_sync_1 = __importDefault(require("tree-sync"));
const standalone_addon_build_1 = require("./standalone-addon-build");
// This build stage expects to be run with broccoli memoization enabled in order
// to get good rebuild performance. We turn it on by default here, but you can
// still explicitly turn it off by setting the env var to "false".
//
// As for safetly mutating process.env: broccoli doesn't read this until a Node
// executes its build hook, so as far as I can tell there's no way we could set
// this too late.
if (typeof process.env.BROCCOLI_ENABLED_MEMOIZE === 'undefined') {
    process.env.BROCCOLI_ENABLED_MEMOIZE = 'true';
}
class CompatAddons {
    constructor(compatApp) {
        this.compatApp = compatApp;
        this.didBuild = false;
        this.addons = (0, standalone_addon_build_1.convertLegacyAddons)(compatApp);
        this.inputPath = compatApp.root;
    }
    get tree() {
        return new core_1.WaitForTrees({ addons: this.addons }, '@embroider/compat/addons', this.build.bind(this));
    }
    async ready() {
        return {
            outputPath: (0, path_1.resolve)((0, core_1.locateEmbroiderWorkingDir)(this.compatApp.root), 'rewritten-app'),
        };
    }
    async build({ addons, }, changedMap) {
        if (!this.treeSync) {
            this.treeSync = new tree_sync_1.default(addons, (0, path_1.resolve)((0, core_1.locateEmbroiderWorkingDir)(this.compatApp.root), 'rewritten-packages'));
        }
        if (!this.didBuild || // always copy on the first build
            changedMap.get(addons)) {
            this.treeSync.sync();
            core_1.RewrittenPackageCache.shared('embroider', this.compatApp.root).invalidateIndex();
        }
        this.didBuild = true;
    }
}
exports.default = CompatAddons;
//# sourceMappingURL=compat-addons.js.map