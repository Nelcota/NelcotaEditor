import type { VideoSource, VideoStatus } from "#/modules/video-records/model/video-status";

/** Dates cross the server function boundary as ISO strings. */
export interface AdminOverview {
    userCount: number;
    newUserCount: number;
    bannedUserCount: number;
    adminCount: number;
    videoCount: number;
    newVideoCount: number;
    queuedVideoCount: number;
    workingVideoCount: number;
    failedVideoCount: number;
    readyClipCount: number;
    newClipCount: number;
    processedSeconds: number;
    storageBytes: number;
    storageQuotaBytes: number;
    recentDays: number;
    recentFailures: Array<AdminVideoRow>;
    topStorageUsers: Array<AdminUserRow>;
}

export interface AdminUserRow {
    id: string;
    name: string;
    email: string;
    image: string | null;
    isAdmin: boolean;
    isBanned: boolean;
    videoCount: number;
    storageBytes: number;
    createdAt: string;
}

export interface AdminUserPage {
    users: Array<AdminUserRow>;
    totalCount: number;
}

/** A script can open sessions without end; the details page lists only the latest ones. */
export const MAX_LISTED_SESSIONS = 20;

export interface AdminSessionView {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    expiresAt: string;
    isImpersonation: boolean;
}

export interface AdminUserDetails {
    user: AdminUserRow;
    banReason: string | null;
    banExpiresAt: string | null;
    readyClipCount: number;
    workingVideoCount: number;
    storageQuotaBytes: number;
    sessions: Array<AdminSessionView>;
    activeSessionCount: number;
    isCurrentAdmin: boolean;
}

export interface AdminVideoRow {
    id: string;
    title: string;
    status: VideoStatus;
    source: VideoSource;
    errorMessage: string | null;
    durationSeconds: number | null;
    readyClipCount: number;
    requestedClipCount: number;
    storageBytes: number;
    createdAt: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
}

export interface AdminVideoPage {
    videos: Array<AdminVideoRow>;
    totalCount: number;
}
