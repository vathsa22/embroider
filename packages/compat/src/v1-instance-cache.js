"use strict";
// All access to class ember-cli-provided Addon and EmberApp instances of v1
// packages is supposed to go through here. This lets us control the boundary
// between the new and old words.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("./v1-addon"));
const fs_extra_1 = require("fs-extra");
const core_1 = require("@embroider/core");
class V1InstanceCache {
    constructor(app, packageCache) {
        this.app = app;
        this.packageCache = packageCache;
        // maps from package root directories to known V1 instances of that packages.
        // There can be many because a single copy of an addon may be consumed by many
        // other packages and each gets an instance.
        this.addons = new Map();
        this.app = app;
        this.orderIdx = 0;
        // no reason to do this on demand because the legacy ember app instance
        // already loaded all descendants
        app.legacyEmberAppInstance.project.addons.forEach(addon => {
            this.addAddon(addon);
        });
    }
    adapterClass(addonInstance) {
        let packageName = addonInstance.pkg.name;
        // if the user registered something (including "null", which allows
        // disabling the built-in adapters), that takes precedence.
        let AdapterClass = this.app.options.compatAdapters.get(packageName);
        if (AdapterClass === null) {
            return v1_addon_1.default;
        }
        if (!AdapterClass) {
            let path = `${__dirname}/compat-adapters/${packageName}.js`;
            if ((0, fs_extra_1.pathExistsSync)(path)) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                AdapterClass = require(path).default;
            }
        }
        if (!AdapterClass) {
            return v1_addon_1.default;
        }
        if (AdapterClass.shouldApplyAdapter) {
            return AdapterClass.shouldApplyAdapter(addonInstance) ? AdapterClass : v1_addon_1.default;
        }
        return AdapterClass;
    }
    addAddon(addonInstance) {
        // Traverse and add any nested addons. This must happen _before_ we add
        // the addon itself to correctly preserve the addon ordering.
        addonInstance.addons.forEach(a => this.addAddon(a));
        this.orderIdx += 1;
        let Klass = this.adapterClass(addonInstance);
        let v1Addon = new Klass(addonInstance, this.app.options, this.app, this.packageCache, this.orderIdx);
        let pkgs = (0, core_1.getOrCreate)(this.addons, v1Addon.root, () => []);
        pkgs.push(v1Addon);
    }
    getAddons(root) {
        return this.addons.get(root) || [];
    }
}
exports.default = V1InstanceCache;
//# sourceMappingURL=v1-instance-cache.js.map