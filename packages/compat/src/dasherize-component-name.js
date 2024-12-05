"use strict";
// copied from https://github.com/emberjs/ember.js/blob/978cf6773d6eea3e656d0da797980305061186cf/packages/ember-template-compiler/lib/system/dasherize-component-name.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.dasherize = dasherize;
exports.snippetToDasherizedName = snippetToDasherizedName;
const SIMPLE_DASHERIZE_REGEXP = /[A-Z]|::/g;
const ALPHA = /[A-Za-z0-9]/;
function dasherize(key) {
    let name = key.replace(SIMPLE_DASHERIZE_REGEXP, (char, index) => {
        if (char === '::') {
            return '/';
        }
        if (index === 0 || !ALPHA.test(key[index - 1])) {
            return char.toLowerCase();
        }
        return `-${char.toLowerCase()}`;
    });
    return name;
}
const NAME_FROM_SNIPPET = /<(?:([^\s/]+).*>)|(?:{{\s?component\s+['"]([^'"]+)['"])|(?:\{\{([^\s]+).*\}\})/;
function snippetToDasherizedName(snippet) {
    var _a, _b;
    let result = NAME_FROM_SNIPPET.exec(snippet);
    if (result) {
        return dasherize((_b = (_a = result[1]) !== null && _a !== void 0 ? _a : result[2]) !== null && _b !== void 0 ? _b : result[3]);
    }
}
//# sourceMappingURL=dasherize-component-name.js.map