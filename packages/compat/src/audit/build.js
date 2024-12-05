"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildError = void 0;
exports.buildApp = buildApp;
exports.isBuildError = isBuildError;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
async function buildApp(options) {
    let result = await execute(`node node_modules/ember-cli/bin/ember build`, {
        pwd: options.app,
        env: {
            STAGE2_ONLY: 'true',
        },
    });
    if (result.exitCode !== 0) {
        throw new BuildError(`${chalk_1.default.yellow('Unable to begin audit')} because the build failed. Build output follows:\n${result.output}`);
    }
}
class BuildError extends Error {
    constructor(buildOutput) {
        super(buildOutput);
        this.isBuildError = true;
    }
}
exports.BuildError = BuildError;
function isBuildError(err) {
    return err === null || err === void 0 ? void 0 : err.isBuildError;
}
async function execute(shellCommand, opts) {
    let env;
    if (opts === null || opts === void 0 ? void 0 : opts.env) {
        env = { ...process.env, ...opts.env };
    }
    let child = (0, child_process_1.spawn)(shellCommand, {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: opts === null || opts === void 0 ? void 0 : opts.pwd,
        shell: true,
        env,
    });
    let stderrBuffer = [];
    let stdoutBuffer = [];
    let combinedBuffer = [];
    child.stderr.on('data', data => {
        stderrBuffer.push(data);
        combinedBuffer.push(data);
    });
    child.stdout.on('data', data => {
        stdoutBuffer.push(data);
        combinedBuffer.push(data);
    });
    return new Promise(resolve => {
        child.on('close', (exitCode) => {
            resolve({
                exitCode,
                get stdout() {
                    return stdoutBuffer.join('');
                },
                get stderr() {
                    return stderrBuffer.join('');
                },
                get output() {
                    return combinedBuffer.join('');
                },
            });
        });
    });
}
//# sourceMappingURL=build.js.map