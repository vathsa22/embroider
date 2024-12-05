"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = loadAstPlugins;
const path_1 = require("path");
function loadAstPlugins(registry) {
    let wrappers = registry.load('htmlbars-ast-plugin');
    for (let wrapper of wrappers) {
        const { plugin, parallelBabel, baseDir, cacheKey } = wrapper;
        if (plugin) {
            // if the parallelBabel options were set on the wrapper, but not on the plugin, add it
            if (parallelBabel && !plugin.parallelBabel) {
                plugin.parallelBabel = {
                    requireFile: (0, path_1.join)(__dirname, 'htmlbars-unwrapper.js'),
                    buildUsing: 'unwrapPlugin',
                    params: parallelBabel,
                };
            }
            // NOTE: `_parallelBabel` (not `parallelBabel`) is expected by broccoli-babel-transpiler
            if (plugin.parallelBabel && !plugin._parallelBabel) {
                plugin._parallelBabel = plugin.parallelBabel;
            }
            // if the baseDir is set on the wrapper, but not on the plugin, add it
            if (baseDir && !plugin.baseDir) {
                plugin.baseDir = baseDir;
            }
            // if the cacheKey is set on the wrapper, but not on the plugin, add it
            if (cacheKey && !plugin.cacheKey) {
                plugin.cacheKey = cacheKey;
            }
        }
    }
    let plugins = wrappers.map((wrapper) => wrapper.plugin);
    // the plugins in the registry historically run in backwards order for dumb
    // reasons. Embroider keeps them in sensible order, so here is where we do the
    // compatibility switch.
    plugins.reverse();
    return plugins;
}
//# sourceMappingURL=prepare-htmlbars-ast-plugins.js.map