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
const v1_addon_1 = __importDefault(require("../v1-addon"));
const typescript_memoize_1 = require("typescript-memoize");
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
class EmberCLIClipboard extends v1_addon_1.default {
    get v2Tree() {
        let tree = super.v2Tree;
        return (0, broccoli_funnel_1.default)(tree, {
            // ember-cli-clipboard is wrapping *everything* in its vendor tree inside
            // a fastboot guard, including a package.json file. The presence a file
            // named "package.json" that isn't actually valid JSON makes packagers
            // like Webpack barf.
            exclude: ['vendor/clipboard/package.json'],
        });
    }
}
exports.default = EmberCLIClipboard;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], EmberCLIClipboard.prototype, "v2Tree", null);
//# sourceMappingURL=ember-cli-clipboard.js.map