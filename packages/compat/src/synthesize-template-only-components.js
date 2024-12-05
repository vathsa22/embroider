"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const path_1 = require("path");
const walk_sync_1 = __importDefault(require("walk-sync"));
const fs_extra_1 = require("fs-extra");
const source = `import templateOnlyComponent from '@ember/component/template-only';
export default templateOnlyComponent();`;
const jsExtensions = ['.js', '.ts', '.mjs', '.mts'];
function importTemplate(files) {
    return `/* import __COLOCATED_TEMPLATE__ from './${(0, path_1.basename)(files.template.relativePath)}'; */\n`;
}
class SynthesizeTemplateOnlyComponents extends broccoli_plugin_1.default {
    constructor(tree, params) {
        super([tree], {
            annotation: `synthesize-template-only-components:${params.allowedPaths.join(':')}`,
            persistentOutput: true,
            needsCache: false,
        });
        this.emitted = new Map();
        this.allowedPaths = params.allowedPaths;
        this.templateExtensions = params.templateExtensions;
    }
    async build() {
        let unneeded = new Set(this.emitted.keys());
        for (let dir of this.allowedPaths) {
            let entries = this.crawl((0, path_1.join)(this.inputPaths[0], dir));
            for (let [name, files] of entries) {
                let fullName = (0, path_1.join)(this.outputPath, dir, name);
                unneeded.delete(fullName);
                if (files.javascript && files.template) {
                    this.addTemplateImport(fullName, files);
                }
                else if (files.template) {
                    this.addTemplateOnlyComponent(fullName, files);
                }
                else {
                    this.remove(fullName);
                }
            }
        }
        for (let fullName of unneeded) {
            this.remove(fullName);
        }
    }
    addTemplateOnlyComponent(filename, files) {
        const emitted = this.emitted.get(filename);
        if ((emitted === null || emitted === void 0 ? void 0 : emitted.type) !== 'template-only-component') {
            // special case: ember-cli doesn't allow template-only components named
            // "template.hbs" because there are too many people doing a "pods-like"
            // layout that happens to match that pattern.🤮
            if ((0, path_1.basename)(filename) !== 'template') {
                const outputPath = filename + '.js';
                (0, fs_extra_1.outputFileSync)(outputPath, importTemplate(files) + source, 'utf8');
                this.emitted.set(filename, { type: 'template-only-component', outputPath });
                if (emitted && emitted.outputPath !== outputPath) {
                    (0, fs_extra_1.removeSync)(emitted.outputPath);
                }
            }
        }
    }
    addTemplateImport(filename, files) {
        const emitted = this.emitted.get(filename);
        const mtime = files.javascript.mtime;
        if (!((emitted === null || emitted === void 0 ? void 0 : emitted.type) === 'template-import' && emitted.mtime === mtime)) {
            const inputSource = (0, fs_extra_1.readFileSync)(files.javascript.fullPath, { encoding: 'utf8' });
            const outputPath = filename + (0, path_1.extname)(files.javascript.relativePath);
            // If we are ok with appending instead, copy + append maybe more efficient?
            (0, fs_extra_1.outputFileSync)(outputPath, importTemplate(files) + inputSource, 'utf8');
            this.emitted.set(filename, { type: 'template-import', outputPath, mtime });
            if (emitted && emitted.outputPath !== outputPath) {
                (0, fs_extra_1.removeSync)(emitted.outputPath);
            }
        }
    }
    remove(filename) {
        const emitted = this.emitted.get(filename);
        if (emitted) {
            (0, fs_extra_1.removeSync)(emitted.outputPath);
            this.emitted.delete(filename);
        }
    }
    crawl(dir) {
        var _a, _b;
        const entries = new Map();
        if ((0, fs_extra_1.pathExistsSync)(dir)) {
            for (let entry of walk_sync_1.default.entries(dir, { directories: false })) {
                const templateExtension = this.templateExtensions.find(ext => entry.relativePath.endsWith(ext));
                if (templateExtension) {
                    const key = entry.relativePath.slice(0, -1 * templateExtension.length);
                    entries.set(key, { template: entry, javascript: (_a = entries.get(key)) === null || _a === void 0 ? void 0 : _a.javascript });
                    continue;
                }
                const jsExtension = jsExtensions.find(ext => entry.relativePath.endsWith(ext));
                if (jsExtension) {
                    const key = entry.relativePath.slice(0, -1 * jsExtension.length);
                    entries.set(key, { template: (_b = entries.get(key)) === null || _b === void 0 ? void 0 : _b.template, javascript: entry });
                    continue;
                }
            }
        }
        return entries;
    }
}
exports.default = SynthesizeTemplateOnlyComponents;
//# sourceMappingURL=synthesize-template-only-components.js.map