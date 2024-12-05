"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
class EmberCliFastbootTesting extends v1_addon_1.default {
    get v2Tree() {
        let tree = super.v2Tree;
        let originalOutputReady = this.addonInstance.outputReady;
        let projectRoot = this.addonInstance.project.root;
        this.addonInstance.outputReady = function () {
            return originalOutputReady.call(this, {
                directory: `${projectRoot}/dist`,
            });
        };
        return tree;
    }
}
exports.default = EmberCliFastbootTesting;
//# sourceMappingURL=ember-cli-fastboot-testing.js.map