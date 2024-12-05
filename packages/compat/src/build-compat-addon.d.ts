import type V1InstanceCache from './v1-instance-cache';
import type { Package } from '@embroider/core';
import type { Node } from 'broccoli-node-api';
export default function buildCompatAddon(originalPackage: Package, v1Cache: V1InstanceCache): Node;
