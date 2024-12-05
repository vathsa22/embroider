"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let rules = {
    package: 'ember-element-helper',
    addonModules: {
        'helpers/-element.js': {
            dependsOnComponents: ['{{-dynamic-element}}', '{{-dynamic-element-alt}}'],
        },
    },
    components: {},
};
exports.default = [rules];
//# sourceMappingURL=ember-element-helper.js.map