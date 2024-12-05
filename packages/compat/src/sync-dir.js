"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncDir = void 0;
const assert_never_1 = __importDefault(require("assert-never"));
const fs_tree_diff_1 = __importDefault(require("fs-tree-diff"));
const walk_sync_1 = __importDefault(require("walk-sync"));
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
// mirrors the changes in the src dir to the dest dir, while tracking the
// current set of files present. If dest is undefined, it only tracks the set of
// files without mirroring the changes to anywhere
class SyncDir {
    constructor(src, dest) {
        this.src = src;
        this.dest = dest;
        this.prev = new fs_tree_diff_1.default();
        this.files = new Set();
    }
    update() {
        let next = new fs_tree_diff_1.default({
            entries: walk_sync_1.default.entries(this.src),
        });
        for (let [operation, relativePath] of this.prev.calculatePatch(next)) {
            let outputPath;
            if (this.dest) {
                outputPath = (0, path_1.resolve)(this.dest, relativePath);
            }
            switch (operation) {
                case 'unlink':
                    if (outputPath) {
                        (0, fs_extra_1.unlinkSync)(outputPath);
                    }
                    this.files.delete(relativePath);
                    break;
                case 'rmdir':
                    if (outputPath) {
                        (0, fs_extra_1.rmdirSync)(outputPath);
                    }
                    break;
                case 'mkdir':
                    if (outputPath) {
                        (0, fs_extra_1.mkdirpSync)(outputPath);
                    }
                    break;
                case 'change':
                    if (outputPath) {
                        (0, fs_extra_1.removeSync)(outputPath);
                        (0, fs_extra_1.copySync)((0, path_1.resolve)(this.src, relativePath), outputPath, { dereference: true });
                    }
                    break;
                case 'create':
                    if (outputPath) {
                        (0, fs_extra_1.copySync)((0, path_1.resolve)(this.src, relativePath), outputPath, { dereference: true });
                    }
                    this.files.add(relativePath);
                    break;
                default:
                    (0, assert_never_1.default)(operation);
            }
            this.prev = next;
        }
    }
}
exports.SyncDir = SyncDir;
//# sourceMappingURL=sync-dir.js.map