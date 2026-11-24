import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { getEnvironment } from "#/shared/server/env.server";
import { getVideoDirectory } from "#/shared/server/storage.server";

/** Everything the worker creates lives under this folder, never at WORK_DIR itself. */
const WORKSPACES_FOLDER_NAME = "videos";

function resolveWorkspacesRoot(): string {
    const environment = getEnvironment();

    return path.resolve(environment.WORK_DIR, WORKSPACES_FOLDER_NAME);
}

function resolveVideoWorkspace(videoId: string): string {
    // getVideoDirectory rejects ids that could point the path at another folder.
    const videoDirectory = getVideoDirectory(videoId);

    return path.join(resolveWorkspacesRoot(), path.basename(videoDirectory));
}

/**
 * An empty local folder for one run of a video: downloads, audio chunks and renders sit here
 * until they are stored. Whatever a crashed run left is removed first.
 */
export async function createVideoWorkspace(videoId: string): Promise<string> {
    const workspace = resolveVideoWorkspace(videoId);

    await rm(workspace, { recursive: true, force: true });
    await mkdir(workspace, { recursive: true });
    return workspace;
}

export async function removeVideoWorkspace(videoId: string): Promise<void> {
    await rm(resolveVideoWorkspace(videoId), { recursive: true, force: true });
}

/** On start no run is in progress, so anything left belongs to a run that died with the worker. */
export async function removeAllVideoWorkspaces(): Promise<void> {
    await rm(resolveWorkspacesRoot(), { recursive: true, force: true });
}
