"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_funnel_1 = require("broccoli-funnel");
class AddToTree extends broccoli_funnel_1.Funnel {
    constructor(combinedVendor, hook) {
        super(combinedVendor, {
            annotation: '@embroider/compat/synthvendor',
        });
        this.hook = hook;
    }
    shouldLinkRoots() {
        // We want to force funnel to copy things rather than just linking the whole
        // directory, because we're planning to mutate it.
        return false;
    }
    async build() {
        await super.build();
        await this.hook(this.outputPath);
    }
}
exports.default = AddToTree;
//# sourceMappingURL=add-to-tree.js.map