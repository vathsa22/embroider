"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_funnel_1 = require("broccoli-funnel");
const walk_sync_1 = __importDefault(require("walk-sync"));
/*
  This is used to monitor when addons are emitting badly-behaved broccoli
  trees that don't follow directory-naming conventions.

  We only check on the first build, on the assumption that it's rare to change
  after that.
*/
class Snitch extends broccoli_funnel_1.Funnel {
    constructor(inputTree, snitchOptions, funnelOptions) {
        super(inputTree, funnelOptions);
        this.mustCheck = true;
        this.allowedPaths = snitchOptions.allowedPaths;
        this.foundBadPaths = snitchOptions.foundBadPaths;
    }
    build() {
        if (this.mustCheck) {
            let badPaths = [];
            (0, walk_sync_1.default)(this.inputPaths[0], { directories: false }).map(filename => {
                if (filename === '.gitkeep') {
                    return;
                }
                if (!this.allowedPaths.test(filename)) {
                    badPaths.push(filename);
                }
            });
            if (badPaths.length > 0) {
                this.foundBadPaths(badPaths);
            }
            this.mustCheck = false;
        }
        return super.build();
    }
}
exports.default = Snitch;
//# sourceMappingURL=snitch.js.map