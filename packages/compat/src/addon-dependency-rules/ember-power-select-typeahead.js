"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let rules = {
    package: 'ember-power-select-typeahead',
    addonModules: {
        './components/power-select-typeahead.js': {
            dependsOnComponents: ['{{power-select-typeahead/trigger}}'],
        },
        './components/power-select-multiple.js': {
            dependsOnComponents: ['{{power-select-multiple/trigger}}'],
        },
    },
    components: {
        '{{power-select-typeahead}}': {
            layout: {
                addonPath: 'templates/components/power-select-typeahead.hbs',
            },
            acceptsComponentArguments: [
                'afterOptionsComponent',
                'beforeOptionsComponent',
                'optionsComponent',
                'placeholderComponent',
                'searchMessageComponent',
                'selectedItemComponent',
                'triggerComponent',
            ],
        },
    },
};
exports.default = [rules];
//# sourceMappingURL=ember-power-select-typeahead.js.map