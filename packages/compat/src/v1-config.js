"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteV1Config = exports.V1Config = void 0;
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
class V1Config extends broccoli_plugin_1.default {
    constructor(configTree, env) {
        super([configTree], {});
        this.env = env;
    }
    build() {
        this.lastConfig = JSON.parse((0, fs_extra_1.readFileSync)((0, path_1.join)(this.inputPaths[0], 'environments', `${this.env}.json`), 'utf8'));
    }
    readConfig() {
        if (!this.lastConfig) {
            throw new Error(`V1Config not available until after the build`);
        }
        return this.lastConfig;
    }
}
exports.V1Config = V1Config;
class WriteV1Config extends broccoli_plugin_1.default {
    constructor(inputTree, storeConfigInMeta, testInputTree) {
        super([inputTree, testInputTree].filter(Boolean), {
            persistentOutput: true,
            needsCache: false,
        });
        this.inputTree = inputTree;
        this.storeConfigInMeta = storeConfigInMeta;
        this.testInputTree = testInputTree;
    }
    build() {
        let filename = (0, path_1.join)(this.outputPath, 'config/environment.js');
        let contents;
        if (this.storeConfigInMeta) {
            contents = metaLoader();
        }
        else {
            if (this.testInputTree) {
                contents = `
        import { isTesting } from '@embroider/macros';
        let env;
        if (isTesting()) {
          env = ${JSON.stringify(this.testInputTree.readConfig())};
        } else {
          env = ${JSON.stringify(this.inputTree.readConfig())};
        }
        export default env;
        `;
            }
            else {
                contents = `export default ${JSON.stringify(this.inputTree.readConfig())};`;
            }
        }
        if (!this.lastContents || this.lastContents !== contents) {
            (0, fs_extra_1.outputFileSync)(filename, contents);
        }
        this.lastContents = contents;
    }
}
exports.WriteV1Config = WriteV1Config;
function metaLoader() {
    // Supporting config content as JS Module.
    // Wrapping the content with immediate invoked function as
    // replaced content for config-module was meant to support AMD module.
    return `
    export default (function() {
      {{content-for 'config-module'}}
    })().default;
  `;
}
//# sourceMappingURL=v1-config.js.map