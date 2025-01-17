import core from '@embroider/core';
const { cleanUrl, packageName } = core;
import type { ImportKind, OnResolveResult, PluginBuild } from 'esbuild';
import { dirname } from 'path';

import type { PackageCache as _PackageCache, Resolution, ModuleRequest, RequestAdapter } from '@embroider/core';
import { externalName } from '@embroider/reverse-exports';

type PublicAPI<T> = { [K in keyof T]: T[K] };
type PackageCache = PublicAPI<_PackageCache>;

export class EsBuildRequestAdapter implements RequestAdapter<Resolution<OnResolveResult, OnResolveResult>> {
  static create({
    packageCache,
    phase,
    build,
    kind,
    path,
    importer,
    pluginData,
  }: {
    packageCache: PackageCache;
    phase: 'bundling' | 'other';
    build: PluginBuild;
    kind: ImportKind;
    path: string;
    importer: string | undefined;
    pluginData: Record<string, any> | undefined;
  }) {
    if (!(pluginData?.embroider?.enableCustomResolver ?? true)) {
      return;
    }

    if (path && importer && path[0] !== '\0' && !path.startsWith('virtual-module:')) {
      let fromFile = cleanUrl(importer);
      return {
        initialState: {
          specifier: path,
          fromFile,
          meta: pluginData?.embroider?.meta,
        },
        adapter: new EsBuildRequestAdapter(packageCache, phase, build, kind),
      };
    }
  }

  private constructor(
    private packageCache: PackageCache,
    private phase: 'bundling' | 'other',
    private context: PluginBuild,
    private kind: ImportKind
  ) {}

  get debugType() {
    return 'esbuild';
  }

  async resolve(
    request: ModuleRequest<Resolution<OnResolveResult, OnResolveResult>>
  ): Promise<Resolution<OnResolveResult, OnResolveResult>> {
    if (request.isVirtual) {
      return {
        type: 'found',
        filename: request.specifier,
        result: { path: request.specifier, namespace: 'embroider-virtual' },
        isVirtual: request.isVirtual,
      };
    }
    if (request.isNotFound) {
      // todo: make sure this looks correct to users
      return {
        type: 'not_found',
        err: {
          errors: [{ text: `module not found ${request.specifier}` }],
        },
      };
    }

    requestStatus(request.specifier);

    let result = await this.context.resolve(request.specifier, {
      importer: request.fromFile,
      resolveDir: dirname(request.fromFile),
      kind: this.kind,
      pluginData: {
        embroider: {
          enableCustomResolver: false,
          meta: request.meta,
        },
      },
    });

    let status = readStatus(request.specifier);

    if (result.errors.length > 0 || status === 'not_found') {
      return { type: 'not_found', err: result };
    } else if (result.external) {
      return { type: 'ignored', result };
    } else {
      if (this.phase === 'bundling') {
        // we need to ensure that we don't traverse back into the app while
        // doing dependency pre-bundling. There are multiple ways an addon can
        // resolve things from the app, due to the existince of both app-js
        // (modules in addons that are logically part of the app's namespace)
        // and non-strict handlebars (which resolves
        // components/helpers/modifiers against the app's global pool).
        let pkg = this.packageCache.ownerOfFile(result.path);
        if (pkg?.root === this.packageCache.appRoot) {
          let externalizedName = request.specifier;
          if (!packageName(externalizedName)) {
            // the request was a relative path. This won't remain valid once
            // it has been bundled into vite/deps. But we know it targets the
            // app, so we can always convert it into a non-relative import
            // from the app's namespace
            //
            // IMPORTANT: whenever an addon resolves a relative path to the
            // app, it does so because our code in the core resolver has
            // rewritten the request to be relative to the app's root. So here
            // we will only ever encounter relative paths that are already
            // relative to the app's root directory.
            externalizedName = externalName(pkg.packageJSON, externalizedName) || externalizedName;
          }
          return {
            type: 'ignored',
            result: {
              path: externalizedName,
              external: true,
            },
          };
        }
      }
      return { type: 'found', filename: result.path, result, isVirtual: request.isVirtual };
    }
  }
}

/*
  This is an unfortunate necessity. During depscan, vite deliberately hides
  information from esbuild. Specifically, it treats "not found" and "this is an
  external dependency" as both "external: true". But we really care about the
  difference, since we have fallback behaviors for the "not found" case. Using
  this global state, our rollup resolver plugin can observe what vite is
  actually doing and communicate that knowledge outward to our esbuild resolver
  plugin.
 */
function sharedGlobalState() {
  let channel = (globalThis as any).__embroider_vite_resolver_channel__ as
    | undefined
    | Map<string, 'pending' | 'found' | 'not_found'>;
  if (!channel) {
    channel = new Map();
    (globalThis as any).__embroider_vite_resolver_channel__ = channel;
  }
  return channel;
}

function requestStatus(id: string): void {
  sharedGlobalState().set(id, 'pending');
}

export function writeStatus(id: string, status: 'found' | 'not_found'): void {
  let channel = sharedGlobalState();
  if (channel.get(id) === 'pending') {
    channel.set(id, status);
  }
}

function readStatus(id: string): 'pending' | 'not_found' | 'found' {
  let channel = sharedGlobalState();
  let result = channel.get(id) ?? 'pending';
  channel.delete(id);
  return result;
}
