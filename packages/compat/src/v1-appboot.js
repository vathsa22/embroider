"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadV1AppBoot = exports.WriteV1AppBoot = void 0;
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
class WriteV1AppBoot extends broccoli_plugin_1.default {
    constructor() {
        super([], {
            persistentOutput: true,
            needsCache: false,
        });
    }
    build() {
        let filename = (0, path_1.join)(this.outputPath, 'config/app-boot.js');
        let contents = `{{content-for "app-boot"}}`;
        if (!this.lastContents || this.lastContents !== contents) {
            (0, fs_extra_1.outputFileSync)(filename, contents);
        }
        this.lastContents = contents;
    }
}
exports.WriteV1AppBoot = WriteV1AppBoot;
class ReadV1AppBoot extends broccoli_plugin_1.default {
    constructor(appBootTree) {
        super([appBootTree], {
            persistentOutput: true,
            needsCache: false,
        });
        this.hasBuilt = false;
    }
    build() {
        this.appBoot = (0, fs_extra_1.readFileSync)((0, path_1.join)(this.inputPaths[0], `config/app-boot.js`), 'utf8');
        this.hasBuilt = true;
    }
    readAppBoot() {
        if (!this.hasBuilt) {
            throw new Error(`AppBoot not available until after the build`);
        }
        return this.appBoot;
    }
}
exports.ReadV1AppBoot = ReadV1AppBoot;
//# sourceMappingURL=v1-appboot.js.map