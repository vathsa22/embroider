"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const broccoli_file_creator_1 = __importDefault(require("broccoli-file-creator"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const semver_1 = __importDefault(require("semver"));
function createIndexContents(config) {
    return `export default ${JSON.stringify(config)};`;
}
/**
 * The `ember-get-config` addon conceptually does just one thing: re-exports the `config/environment` runtime module
 * from the host app so that addons can import it themseles. It handles the "hard part" of knowing what the host app's
 * module name is, since that's not something an addon can normally know ahead of time.
 *
 * From a dependency graph perspective though, declaring all of the dependencies correctly would require a circular
 * dependency from the addon back to the host app itself, which we don't want to introduce.
 *
 * We need to basically re-implement the entire addon's behavior so that it still exports the app's
 * `config/environment` runtime value, but without needing it to actually export from the host app's module.
 */
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const configModule = require(this.app.configPath());
        const appEnvironmentConfig = configModule(this.app.env);
        return (0, broccoli_merge_trees_1.default)([
            (0, broccoli_file_creator_1.default)('index.js', createIndexContents(appEnvironmentConfig)),
            (0, broccoli_file_creator_1.default)('package.json', JSON.stringify(this.newPackageJSON, null, 2)),
        ]);
    }
    // v2.1.0 now behaves the same under Embroider as it does in a classic build:
    // https://github.com/mansona/ember-get-config/pull/45
    static shouldApplyAdapter(addonInstance) {
        return semver_1.default.lt(addonInstance.pkg.version, '2.1.0');
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-get-config.js.map