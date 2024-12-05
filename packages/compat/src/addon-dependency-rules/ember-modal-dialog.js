"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rules = [
    {
        package: 'ember-modal-dialog',
        components: {
            '<ModalDialog/>': {
                invokes: {
                    modalDialogComponentName: [
                        '{{ember-modal-dialog/-in-place-dialog}}',
                        '{{ember-modal-dialog/-liquid-tether-dialog}}',
                        '{{ember-modal-dialog/-tether-dialog}}',
                        '{{ember-modal-dialog/-liquid-dialog}}',
                        '{{ember-modal-dialog/-basic-dialog}}',
                    ],
                },
                layout: {
                    addonPath: 'templates/components/modal-dialog.hbs',
                },
            },
            '<LiquidWormhole/>': { safeToIgnore: true },
            '<LiquidTether/>': { safeToIgnore: true },
        },
    },
];
exports.default = rules;
//# sourceMappingURL=ember-modal-dialog.js.map