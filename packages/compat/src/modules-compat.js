"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = modulesCompat;
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
// there is a weirder, older behavior where addons wrapped their addon tree
// output in a `modules` folder. This strips that level off if it exists,
// without discarding any other content that was not inside `modules`.
function modulesCompat(tree) {
    return (0, broccoli_merge_trees_1.default)([
        (0, broccoli_funnel_1.default)(tree, { exclude: ['modules'] }),
        (0, broccoli_funnel_1.default)(tree, { srcDir: 'modules', allowEmpty: true }),
    ]);
}
//# sourceMappingURL=modules-compat.js.map