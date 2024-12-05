#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs/yargs"));
const audit_1 = require("./audit");
// slightly wacky because yargs types don't cover this, but you can't access the
// other documented place to find `hideBin` on node < 12.17
const { hideBin } = yargs_1.default;
function runCLI() {
    return (0, yargs_1.default)(hideBin(process.argv))
        .command('$0', 'audit your app for embroider compatibility problems', yargs => {
        return yargs
            .option('debug', {
            alias: 'd',
            type: 'boolean',
            description: 'Add debug logging about the audit itself',
            default: false,
        })
            .option('json', {
            alias: 'j',
            type: 'boolean',
            description: 'Print results in JSON format',
            default: false,
        })
            .option('reuse-build', {
            alias: 'r',
            type: 'boolean',
            description: 'Reuse previous build',
            default: false,
        })
            .option('load', {
            alias: 'l',
            type: 'string',
            description: 'Load previous audit results from a JSON file instead of running a new audit',
        })
            .option('save', {
            alias: 's',
            type: 'string',
            description: 'Save audit results as a JSON file.',
        })
            .option('app', {
            type: 'string',
            description: 'Path to your app',
            default: process.cwd(),
        })
            .option('filter', {
            type: 'string',
            description: 'Path to a JS file that describes which findings to silence. Generate the initial file using `--create-filter`.',
        })
            .option('create-filter', {
            type: 'string',
            description: 'Path to a JS file where we will create a filter that will silence all your current findings. Pass it back into future audits via --filter',
        })
            .fail(function (_, err, _yargs) {
            if ((0, audit_1.isBuildError)(err)) {
                process.stderr.write(err.message + '\n');
            }
            else {
                console.error(err);
            }
            process.exit(1);
        });
    }, async (options) => {
        let filter = loadFilter(options);
        let results;
        if (options.load) {
            results = new audit_1.AuditResults();
            Object.assign(results, (0, fs_extra_1.readJSONSync)(options.load));
        }
        else {
            results = await audit_1.Audit.run(options);
        }
        if (options.save) {
            (0, fs_extra_1.writeFileSync)(options.save, JSON.stringify(results, null, 2));
        }
        applyFilter(filter, results);
        if (options.json) {
            process.stdout.write(JSON.stringify(results, null, 2) + '\n');
        }
        else {
            process.stdout.write(results.humanReadable());
        }
        if (options['create-filter']) {
            createFilter(options['create-filter'], results);
        }
        process.exit(results.perfect ? 0 : 1);
    })
        .command('pretty', 'format JSON audit results as pretty human-readable results', yargs => {
        return yargs.option('filter', {
            type: 'string',
            description: 'Path to a JS file that describes which findings to silence. Generate the file using `embroider-compat-audit acknowledge`',
        });
    }, async (options) => {
        let filter = loadFilter(options);
        let results = new audit_1.AuditResults();
        // process.stdin.fd is a documented public API. The Node typings don't
        // seem to know about it.
        Object.assign(results, JSON.parse((0, fs_extra_1.readFileSync)(process.stdin.fd, 'utf8')));
        applyFilter(filter, results);
        process.stdout.write(results.humanReadable());
        process.exit(0);
    })
        .command('acknowledge', 'Pipe your audit JSON to this command to generate a filter file that will silence the current issues. Pass the filter file into your next audit via --filter. Delete findings out of the filter file as you address them.', yargs => yargs, async () => {
        let results = new audit_1.AuditResults();
        // process.stdin.fd is a documented public API. The Node typings don't
        // seem to know about it.
        Object.assign(results, JSON.parse((0, fs_extra_1.readFileSync)(process.stdin.fd, 'utf8')));
        let findings = results.findings.map(f => ({
            filename: f.filename,
            message: f.message,
            detail: f.detail,
        }));
        process.stdout.write(`module.exports = ${JSON.stringify({ findings }, null, 2)};\n`);
        process.exit(0);
    }).argv;
}
if (require.main === module) {
    runCLI();
}
function loadFilter(options) {
    if (options.filter) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require((0, path_1.resolve)(options.filter));
    }
}
function applyFilter(filter, results) {
    if (filter) {
        results.findings = results.findings.filter(finding => {
            return !filter.findings.find(filtered => {
                return (filtered.message === finding.message &&
                    filtered.detail === finding.detail &&
                    filtered.filename === finding.filename);
            });
        });
    }
}
function createFilter(filename, results) {
    let findings = results.findings.map(f => ({
        filename: f.filename,
        message: f.message,
        detail: f.detail,
    }));
    (0, fs_extra_1.writeFileSync)(filename, `module.exports = ${JSON.stringify({ findings }, null, 2)};\n`);
}
//# sourceMappingURL=audit-cli.js.map