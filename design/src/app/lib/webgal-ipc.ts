/**
 * Frontend IPC layer — wraps Tauri invoke calls to the Rust backend.
 * All WebGAL parsing / serialization / file I/O / project management goes through here.
 */

import { invoke } from '@tauri-apps/api/core';
import type { WebGalNode } from './webgal-types';

// ---------------------------------------------------------------------------
// Scene parsing & serialization
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Project management
// ---------------------------------------------------------------------------

export interface ProjectInfo {
  path: string;
  config: Record<string, string>;
  scenes: string[];
}

/** Initialize a new WebGAL project at baseDir/name/. */
export async function initProject(baseDir: string, name: string): Promise<ProjectInfo> {
  return invoke<ProjectInfo>('init_project', { baseDir, name });
}

/** Open an existing WebGAL project by its root directory path. */
export async function openProject(path: string): Promise<ProjectInfo> {
  return invoke<ProjectInfo>('open_project', { path });
}

/** Update config.txt for a project. */
export async function saveConfig(projectPath: string, config: Record<string, string>): Promise<void> {
  return invoke<void>('save_config', { projectPath, config });
}

/** Get the full disk path for a scene file within a project. */
export async function getScenePath(projectPath: string, sceneName: string): Promise<string> {
  return invoke<string>('get_scene_path', { projectPath, sceneName });
}

/** Create a new scene file in the project. */
export async function createScene(projectPath: string, sceneName: string): Promise<string> {
  return invoke<string>('create_scene', { projectPath, sceneName });
}
