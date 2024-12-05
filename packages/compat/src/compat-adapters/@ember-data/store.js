"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ember_data_1 = require("../ember-data");
class EmberDataStore extends ember_data_1.EmberDataBase {
    get packageMeta() {
        var _a;
        let meta = super.packageMeta;
        // this is here because the compat-adapter for @ember-data/debug adds this
        // to externals because it has an undeclared peerDep on us, and thus might
        // resolve totally incorrect copies. By making it external we leave it up to
        // runtime, where we will find this implicit-module for the actual copy of
        // @ember-data/store that is active in app.
        meta['implicit-modules'] = [...((_a = meta['implicit-modules']) !== null && _a !== void 0 ? _a : []), './index.js'];
        return meta;
    }
}
exports.default = EmberDataStore;
//# sourceMappingURL=store.js.map