"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../../v1-addon"));
const semver_1 = require("semver");
class default_1 extends v1_addon_1.default {
    // our heuristic for detecting tree suppression can't deal with the way
    // test-waiters patches treeFor on other copies of its addon instances all
    // over the place. It causes us to falsely detect that it's trying to suppress
    // all tree output, reducing in empty copies.
    suppressesTree(_name) {
        return false;
    }
    reduceInstances(instances) {
        if (!(0, semver_1.satisfies)(this.packageJSON.version, '>=3.0.2')) {
            throw new Error(`@ember/test-waiters cannot work safely under embroider before version 3.0.2 due to https://github.com/emberjs/ember-test-waiters/pull/388. You have a copy at version ${this.packageJSON.version}.`);
        }
        // we know test waiters tries to dedup itself, so there's no point in building
        // and smooshing many copies.
        return [instances[0]];
    }
}
exports.default = default_1;
//# sourceMappingURL=test-waiters.js.map