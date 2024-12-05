"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = main;
const path_1 = require("path");
const babel_import_util_1 = require("babel-import-util");
const fs_extra_1 = require("fs-extra");
const core_1 = require("@embroider/core");
const dasherize_component_name_1 = require("./dasherize-component-name");
const dependency_rules_1 = require("./dependency-rules");
function main(babel) {
    let t = babel.types;
    let cached;
    function getConfig(appRoot) {
        if (cached) {
            return cached;
        }
        let resolverOptions = (0, fs_extra_1.readJSONSync)((0, path_1.join)((0, core_1.locateEmbroiderWorkingDir)(appRoot), 'resolver.json'));
        let resolver = new core_1.Resolver(resolverOptions);
        cached = {
            resolverOptions,
            resolver,
            extraImports: preprocessExtraImports(resolverOptions, resolver),
            componentExtraImports: preprocessComponentExtraImports(resolverOptions),
        };
        return cached;
    }
    return {
        visitor: {
            Program: {
                enter(path, state) {
                    addExtraImports(t, path, getConfig(state.opts.appRoot));
                },
            },
        },
    };
}
main.baseDir = function () {
    return (0, path_1.join)(__dirname, '..');
};
function addExtraImports(t, path, config) {
    let filename = path.hub.file.opts.filename;
    let entry = config.extraImports[filename];
    let adder = new babel_import_util_1.ImportUtil(t, path);
    if (entry) {
        applyRules(t, path, entry, adder, config, filename);
    }
    let componentName = config.resolver.reverseComponentLookup(filename);
    if (componentName) {
        let rules = config.componentExtraImports[componentName];
        if (rules) {
            applyRules(t, path, rules, adder, config, filename);
        }
    }
}
function applyRules(t, path, rules, adder, config, filename) {
    let lookup = lazyPackageLookup(config, filename);
    if (rules.dependsOnModules) {
        for (let target of rules.dependsOnModules) {
            if (lookup.owningPackage) {
                let runtimeName;
                if ((0, core_1.packageName)(target)) {
                    runtimeName = target;
                }
                else {
                    runtimeName = (0, core_1.unrelativize)(lookup.owningPackage, target, filename);
                }
                path.node.body.unshift(amdDefine(t, adder, path, target, runtimeName));
            }
        }
    }
    if (rules.dependsOnComponents) {
        for (let dasherizedName of rules.dependsOnComponents) {
            if (lookup.owningEngine) {
                path.node.body.unshift(amdDefine(t, adder, path, `#embroider_compat/components/${dasherizedName}`, `${lookup.owningEngine.packageName}/components/${dasherizedName}`));
            }
        }
    }
}
function amdDefine(t, adder, path, target, runtimeName) {
    let value = t.callExpression(adder.import(path, '@embroider/macros', 'importSync'), [t.stringLiteral(target)]);
    return t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('window'), t.identifier('define')), [
        t.stringLiteral(runtimeName),
        t.functionExpression(null, [], t.blockStatement([t.returnStatement(value)])),
    ]));
}
function preprocessExtraImports(config, resolver) {
    let extraImports = {};
    for (let rule of config.activePackageRules) {
        if (rule.addonModules) {
            for (let [filename, moduleRules] of Object.entries(rule.addonModules)) {
                for (let root of rule.roots) {
                    expandDependsOnRules(root, filename, moduleRules, extraImports);
                }
            }
        }
        if (rule.appModules) {
            for (let [filename, moduleRules] of Object.entries(rule.appModules)) {
                for (let root of rule.roots) {
                    // in general v2 addons can keep their app tree stuff in other places
                    // than "_app_" and we would need to check their package.json to see.
                    // But this code is only for applying packageRules to auto-upgraded v1
                    // addons, and those we always organize with their treeForApp output
                    // in _app_.
                    expandDependsOnRules((0, dependency_rules_1.appTreeRulesDir)(root, resolver), filename, moduleRules, extraImports);
                }
            }
        }
        if (rule.addonTemplates) {
            for (let [filename, moduleRules] of Object.entries(rule.addonTemplates)) {
                for (let root of rule.roots) {
                    expandInvokesRules(root, filename, moduleRules, extraImports);
                }
            }
        }
        if (rule.appTemplates) {
            for (let [filename, moduleRules] of Object.entries(rule.appTemplates)) {
                for (let root of rule.roots) {
                    expandInvokesRules((0, dependency_rules_1.appTreeRulesDir)(root, resolver), filename, moduleRules, extraImports);
                }
            }
        }
    }
    return extraImports;
}
function lazyPackageLookup(config, filename) {
    let owningPackage;
    let owningEngine;
    return {
        get owningPackage() {
            if (!owningPackage) {
                owningPackage = { result: config.resolver.packageCache.ownerOfFile(filename) };
            }
            return owningPackage.result;
        },
        get owningEngine() {
            if (!owningEngine) {
                owningEngine = { result: undefined };
                let p = this.owningPackage;
                if (p) {
                    owningEngine.result = config.resolver.owningEngine(p);
                }
            }
            return owningEngine.result;
        },
    };
}
function preprocessComponentExtraImports(config) {
    let extraImports = {};
    for (let rule of config.activePackageRules) {
        if (rule.components) {
            for (let [componentName, rules] of Object.entries(rule.components)) {
                if (rules.invokes) {
                    extraImports[dasherizeComponent(componentName, rule)] = {
                        dependsOnComponents: Object.values(rules.invokes)
                            .flat()
                            .map(c => dasherizeComponent(c, rules)),
                    };
                }
            }
        }
    }
    return extraImports;
}
function dasherizeComponent(componentSnippet, rules) {
    let d = (0, dasherize_component_name_1.snippetToDasherizedName)(componentSnippet);
    if (!d) {
        throw new Error(`unable to parse component snippet "${componentSnippet}" from rule ${JSON.stringify(rules, null, 2)}`);
    }
    return d;
}
function expandDependsOnRules(root, filename, rules, extraImports) {
    if (rules.dependsOnModules || rules.dependsOnComponents) {
        let entry = {};
        if (rules.dependsOnModules) {
            entry.dependsOnModules = rules.dependsOnModules;
        }
        if (rules.dependsOnComponents) {
            entry.dependsOnComponents = rules.dependsOnComponents.map(c => dasherizeComponent(c, rules));
        }
        extraImports[(0, path_1.join)(root, filename)] = entry;
    }
}
function expandInvokesRules(root, filename, rules, extraImports) {
    if (rules.invokes) {
        let dependsOnComponents = [];
        for (let componentList of Object.values(rules.invokes)) {
            for (let component of componentList) {
                let d = (0, dasherize_component_name_1.snippetToDasherizedName)(component);
                if (!d) {
                    throw new Error(`unable to parse component snippet "${component}" from rule ${JSON.stringify(rules, null, 2)}`);
                }
                dependsOnComponents.push(d);
            }
        }
        extraImports[(0, path_1.join)(root, filename)] = { dependsOnComponents };
    }
}
//# sourceMappingURL=babel-plugin-adjust-imports.js.map