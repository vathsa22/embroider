"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
class default_1 extends v1_addon_1.default {
    get packageMeta() {
        let meta = super.packageMeta;
        // observer-manager is injected with the undocumented package@service syntax without being app re-exported
        // this makes sure that the service is always re-exported and injectable even when built with staticAddonTrees=true
        if (meta['implicit-modules'] &&
            !meta['implicit-modules'].find(implicitModule => implicitModule === './services/observer-manager.js')) {
            meta['implicit-modules'].push('./services/observer-manager.js');
        }
        else if (!meta['implicit-modules']) {
            meta['implicit-modules'] = ['./services/observer-manager.js'];
        }
        return meta;
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-scroll-modifiers.js.map