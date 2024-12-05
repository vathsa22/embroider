"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stableWorkspaceDir = stableWorkspaceDir;
exports.default = defaultPipeline;
const _1 = require(".");
const core_1 = require("@embroider/core");
const core_2 = require("@embroider/core");
const broccoli_file_creator_1 = __importDefault(require("broccoli-file-creator"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const crypto_1 = require("crypto");
const path_1 = require("path");
const pkg_up_1 = require("pkg-up");
function stableWorkspaceDir(appRoot, environment) {
    let hash = (0, crypto_1.createHash)('md5');
    hash.update((0, path_1.dirname)((0, pkg_up_1.sync)({ cwd: appRoot })));
    hash.update(environment);
    return (0, path_1.join)(core_2.tmpdir, 'embroider', hash.digest('hex').slice(0, 6));
}
function defaultPipeline(emberApp, packager, options = {}) {
    let outputPath;
    let addons;
    let embroiderApp = new _1.App(emberApp, options);
    addons = new _1.Addons(embroiderApp);
    addons.ready().then(result => {
        outputPath = result.outputPath;
    });
    if (process.env.STAGE1_ONLY) {
        return (0, broccoli_merge_trees_1.default)([addons.tree, (0, broccoli_file_creator_1.default)('.stage1-output', () => outputPath)]);
    }
    if (process.env.STAGE2_ONLY || !packager) {
        return (0, broccoli_merge_trees_1.default)([embroiderApp.asStage(addons).tree, (0, broccoli_file_creator_1.default)('.stage2-output', () => outputPath)]);
    }
    let BroccoliPackager = (0, core_1.toBroccoliPlugin)(packager);
    let variants = (options && options.variants) || defaultVariants(emberApp);
    return new BroccoliPackager(embroiderApp.asStage(addons), variants, options && options.packagerOptions);
}
function hasFastboot(emberApp) {
    return emberApp.project.addons.find(a => a.name === 'ember-cli-fastboot');
}
function defaultVariants(emberApp) {
    let variants = [];
    if (emberApp.env === 'production') {
        variants.push({
            name: 'browser',
            runtime: 'browser',
            optimizeForProduction: true,
        });
        if (hasFastboot(emberApp)) {
            variants.push({
                name: 'fastboot',
                runtime: 'fastboot',
                optimizeForProduction: true,
            });
        }
    }
    else {
        variants.push({
            name: 'dev',
            runtime: hasFastboot(emberApp) ? 'all' : 'browser',
            optimizeForProduction: false,
        });
    }
    return variants;
}
//# sourceMappingURL=default-pipeline.js.map