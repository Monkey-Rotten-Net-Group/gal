/**
 * Frontend IPC layer — wraps Tauri invoke calls to the Rust backend.
 * All WebGAL parsing / serialization / file I/O goes through here.
 */

import { invoke } from '@tauri-apps/api/core';
import type { WebGalNode } from './webgal-types';

/** Parse a WebGAL script string → structured nodes (backend). */
export async function parseScene(source: string): Promise<WebGalNode[]> {
  return invoke<WebGalNode[]>('parse_scene', { source });
}

/** Serialize structured nodes → WebGAL script string (backend). */
export async function serializeScene(nodes: WebGalNode[]): Promise<string> {
  return invoke<string>('serialize_scene', { nodes });
}

/** Read a .txt scene file from disk, parse it, return nodes. */
export async function loadScene(path: string): Promise<WebGalNode[]> {
  return invoke<WebGalNode[]>('load_scene', { path });
}

/** Serialize nodes and write to a .txt scene file on disk. */
export async function saveScene(path: string, nodes: WebGalNode[]): Promise<void> {
  return invoke<void>('save_scene', { path, nodes });
}

/** List all .txt scene files in a directory. */
export async function listScenes(dir: string): Promise<string[]> {
  return invoke<string[]>('list_scenes', { dir });
}
