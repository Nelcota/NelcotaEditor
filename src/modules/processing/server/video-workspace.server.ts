import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { runWithVideoProcessingLock } from "#/modules/processing/server/video-processing-lock.server";
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

/** Folders are named after their video, so the name is also the video's processing lock key. */
async function removeWorkspaceUnlessProcessing(
    workspacesRoot: string,
    name: string,
): Promise<void> {
    await runWithVideoProcessingLock(name, async () => {
        await rm(path.join(workspacesRoot, name), { recursive: true, force: true });
    });
}

/**
 * On start, removes what runs that died with a worker left behind. Replicas may share WORK_DIR, so
 * a workspace whose video another worker is processing (it holds the lock) stays.
 */
export async function removeAbandonedVideoWorkspaces(): Promise<void> {
    const workspacesRoot = resolveWorkspacesRoot();

    await mkdir(workspacesRoot, { recursive: true });
    const names = await readdir(workspacesRoot);

    for (const name of names) {
        await removeWorkspaceUnlessProcessing(workspacesRoot, name);
    }
}
