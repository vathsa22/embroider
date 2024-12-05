"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_funnel_1 = require("broccoli-funnel");
class ObserveTree extends broccoli_funnel_1.Funnel {
    constructor(combinedVendor, hook) {
        super(combinedVendor, {
            annotation: '@embroider/compat/observe-tree',
        });
        this.hook = hook;
    }
    async build() {
        await super.build();
        await this.hook(this.outputPath);
    }
}
exports.default = ObserveTree;
//# sourceMappingURL=observe-tree.js.map