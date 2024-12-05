"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@embroider/core");
const typescript_memoize_1 = require("typescript-memoize");
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
// A specialized Package that represents a Dummy App (the app that comes along
// with an addon for purposes of testing that addon).
class DummyPackage extends core_1.Package {
    constructor(root, owningAddonRoot, packageCache) {
        super(root, packageCache, true);
        this.owningAddonRoot = owningAddonRoot;
    }
    get internalPackageJSON() {
        let pkg = (0, cloneDeep_1.default)(this.packageCache.get(this.owningAddonRoot).packageJSON);
        pkg.name = 'dummy';
        return pkg;
    }
    get nonResolvableDeps() {
        let deps = super.nonResolvableDeps;
        if (!deps) {
            deps = new Map();
        }
        const owningAddon = this.packageCache.get(this.owningAddonRoot);
        deps.set(owningAddon.name, owningAddon);
        return deps;
    }
}
exports.default = DummyPackage;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], DummyPackage.prototype, "internalPackageJSON", null);
__decorate([
    (0, typescript_memoize_1.Memoize)()
], DummyPackage.prototype, "nonResolvableDeps", null);
//# sourceMappingURL=dummy-package.js.map