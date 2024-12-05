"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const broccoli_persistent_filter_1 = __importDefault(require("broccoli-persistent-filter"));
class Awk extends broccoli_persistent_filter_1.default {
    constructor(inputNode, search, replace) {
        super(inputNode, {});
        this.search = search;
        this.replace = replace;
    }
    processString(content) {
        return content.replace(this.search, this.replace);
    }
}
class default_1 extends v1_addon_1.default {
    get packageMeta() {
        let meta = super.packageMeta;
        // remove from the build so that it will not be present even with staticAddonTrees = false
        if (meta['implicit-modules']) {
            meta['implicit-modules'] = meta['implicit-modules'].filter(mod => mod !== './-private/router-ext');
        }
        return meta;
    }
    get v2Tree() {
        // dont allow ember-engines to reopen the router as we are doing things with it.
        // this simple deletes the import so the reopen doesn't happen
        return new Awk(super.v2Tree, `import '../-private/router-ext';`, '');
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-engines.js.map