"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const broccoli_persistent_filter_1 = __importDefault(require("broccoli-persistent-filter"));
class Awk extends broccoli_persistent_filter_1.default {
    constructor(inputNode, searchReplaceObj) {
        super(inputNode, {});
        this.searchReplaceObj = searchReplaceObj;
    }
    processString(content) {
        let modifiedContent = content;
        Object.entries(this.searchReplaceObj).forEach(([search, replace]) => {
            modifiedContent = modifiedContent.replace(search, replace);
        });
        return modifiedContent;
    }
}
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        return new Awk(super.v2Tree, {
            "require('./ember-exam-qunit-test-loader');": "require('ember-exam/test-support/-private/ember-exam-qunit-test-loader');",
            "require('./ember-exam-mocha-test-loader')": "require('ember-exam/test-support/-private/ember-exam-mocha-test-loader');",
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-exam.js.map