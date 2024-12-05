"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../../v1-addon"));
class VerticalCollection extends v1_addon_1.default {
    // `@html-next/vertical-collection` does some custom Babel stuff, so we'll let it do it's own thing
    customizes(...names) {
        return super.customizes(...names.filter(n => n !== 'treeForAddon'));
    }
}
exports.default = VerticalCollection;
//# sourceMappingURL=vertical-collection.js.map