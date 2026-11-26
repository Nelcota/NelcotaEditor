import {
    bigint,
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

// Better Auth core tables (https://www.better-auth.com/docs/concepts/database#core-schema), plus
// the admin plugin's fields (https://www.better-auth.com/docs/plugins/admin#schema) and the rate
// limit table (https://www.better-auth.com/docs/concepts/rate-limit).

export const USER_ROLE = "user";
export const ADMIN_ROLE = "admin";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: text("role").default(USER_ROLE).notNull(),
    banned: boolean("banned").default(false).notNull(),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        // Set while an admin is signed in as this user, to support them.
        impersonatedBy: text("impersonated_by").references(() => user.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** Better Auth's rate limit counters: one row per client IP and path, so limits survive restarts. */
export const rateLimit = pgTable(
    "rate_limit",
    {
        id: text("id").primaryKey(),
        key: text("key").notNull().unique(),
        count: integer("count").notNull(),
        // Milliseconds since the epoch, as Better Auth writes it.
        lastRequest: bigint("last_request", { mode: "number" }).notNull(),
    },
    // Better Auth deletes expired rows by this column.
    (table) => [index("rate_limit_last_request_idx").on(table.lastRequest)],
);

// The JWT plugin's signing keys and the OAuth provider tables behind the MCP plugin
// (https://www.better-auth.com/docs/plugins/oauth-provider#schema), as Better Auth's getAuthTables
// lists them for jwt() and mcp(). They let a person's Claude sign in to Editor Oculto.

/** The keys that sign access tokens; requireMcpAuth reads them in process to verify a token. */
export const jwks = pgTable("jwks", {
    id: text("id").primaryKey(),
    publicKey: text("public_key").notNull(),
    privateKey: text("private_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    alg: text("alg"),
    crv: text("crv"),
});

/** An app allowed to ask for tokens, such as Claude registering itself on first connect. */
export const oauthClient = pgTable(
    "oauth_client",
    {
        id: text("id").primaryKey(),
        clientId: text("client_id").notNull().unique(),
        clientSecret: text("client_secret"),
        clientDiscoveryId: text("client_discovery_id"),
        disabled: boolean("disabled").default(false),
        skipConsent: boolean("skip_consent"),
        enableEndSession: boolean("enable_end_session"),
        subjectType: text("subject_type"),
        scopes: text("scopes").array(),
        clientCredentialsScopes: text("client_credentials_scopes").array().default([]),
        userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }),
        updatedAt: timestamp("updated_at", { withTimezone: true }),
        name: text("name"),
        uri: text("uri"),
        icon: text("icon"),
        contacts: text("contacts").array(),
        tos: text("tos"),
        policy: text("policy"),
        softwareId: text("software_id"),
        softwareVersion: text("software_version"),
        softwareStatement: text("software_statement"),
        redirectUris: text("redirect_uris").array().notNull(),
        postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
        backchannelLogoutUri: text("backchannel_logout_uri"),
        backchannelLogoutSessionRequired: boolean("backchannel_logout_session_required"),
        tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
        applicationType: text("application_type"),
        jwks: text("jwks"),
        jwksUri: text("jwks_uri"),
        grantTypes: text("grant_types").array(),
        responseTypes: text("response_types").array(),
        requirePKCE: boolean("require_pkce"),
        dpopBoundAccessTokens: boolean("dpop_bound_access_tokens").default(false),
        referenceId: text("reference_id"),
        metadata: jsonb("metadata"),
    },
    (table) => [index("oauth_client_user_id_idx").on(table.userId)],
);

/** A protected API tokens can be bound to; here, the MCP endpoint. */
export const oauthResource = pgTable("oauth_resource", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull().unique(),
    name: text("name").notNull(),
    accessTokenTtl: integer("access_token_ttl"),
    refreshTokenTtl: integer("refresh_token_ttl"),
    signingAlgorithm: text("signing_algorithm"),
    signingKeyId: text("signing_key_id"),
    allowedScopes: text("allowed_scopes").array(),
    customClaims: jsonb("custom_claims"),
    dpopBoundAccessTokensRequired: boolean("dpop_bound_access_tokens_required").default(false),
    disabled: boolean("disabled").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    policyVersion: integer("policy_version").default(1),
    metadata: jsonb("metadata"),
});

export const oauthClientResource = pgTable(
    "oauth_client_resource",
    {
        id: text("id").primaryKey(),
        clientId: text("client_id")
            .notNull()
            .references(() => oauthClient.clientId, { onDelete: "cascade" }),
        resourceId: text("resource_id")
            .notNull()
            .references(() => oauthResource.identifier, { onDelete: "cascade" }),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true }),
    },
    (table) => [
        index("oauth_client_resource_client_id_idx").on(table.clientId),
        index("oauth_client_resource_resource_id_idx").on(table.resourceId),
    ],
);

export const oauthRefreshToken = pgTable(
    "oauth_refresh_token",
    {
        id: text("id").primaryKey(),
        token: text("token").notNull().unique(),
        clientId: text("client_id")
            .notNull()
            .references(() => oauthClient.clientId, { onDelete: "cascade" }),
        sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        referenceId: text("reference_id"),
        authorizationCodeId: text("authorization_code_id"),
        resources: text("resources").array(),
        requestedUserInfoClaims: text("requested_user_info_claims").array(),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }),
        revoked: timestamp("revoked", { withTimezone: true }),
        rotatedAt: timestamp("rotated_at", { withTimezone: true }),
        rotationReplayResponse: text("rotation_replay_response"),
        rotationReplayExpiresAt: timestamp("rotation_replay_expires_at", { withTimezone: true }),
        authTime: timestamp("auth_time", { withTimezone: true }),
        confirmation: jsonb("confirmation"),
        scopes: text("scopes").array().notNull(),
    },
    (table) => [
        index("oauth_refresh_token_client_id_idx").on(table.clientId),
        index("oauth_refresh_token_session_id_idx").on(table.sessionId),
        index("oauth_refresh_token_user_id_idx").on(table.userId),
        index("oauth_refresh_token_authorization_code_id_idx").on(table.authorizationCodeId),
    ],
);

export const oauthAccessToken = pgTable(
    "oauth_access_token",
    {
        id: text("id").primaryKey(),
        token: text("token").unique(),
        clientId: text("client_id")
            .notNull()
            .references(() => oauthClient.clientId, { onDelete: "cascade" }),
        sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
        userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
        referenceId: text("reference_id"),
        authorizationCodeId: text("authorization_code_id"),
        resources: text("resources").array(),
        requestedUserInfoClaims: text("requested_user_info_claims").array(),
        refreshId: text("refresh_id").references(() => oauthRefreshToken.id, {
            onDelete: "cascade",
        }),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }),
        revoked: timestamp("revoked", { withTimezone: true }),
        confirmation: jsonb("confirmation"),
        scopes: text("scopes").array().notNull(),
    },
    (table) => [
        index("oauth_access_token_client_id_idx").on(table.clientId),
        index("oauth_access_token_session_id_idx").on(table.sessionId),
        index("oauth_access_token_user_id_idx").on(table.userId),
        index("oauth_access_token_authorization_code_id_idx").on(table.authorizationCodeId),
        index("oauth_access_token_refresh_id_idx").on(table.refreshId),
    ],
);

/** What a person allowed an app to do, so they are asked once per app. */
export const oauthConsent = pgTable(
    "oauth_consent",
    {
        id: text("id").primaryKey(),
        clientId: text("client_id")
            .notNull()
            .references(() => oauthClient.clientId, { onDelete: "cascade" }),
        userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
        referenceId: text("reference_id"),
        resources: text("resources").array(),
        requestedUserInfoClaims: text("requested_user_info_claims").array(),
        scopes: text("scopes").array().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }),
        updatedAt: timestamp("updated_at", { withTimezone: true }),
    },
    (table) => [
        index("oauth_consent_client_id_idx").on(table.clientId),
        index("oauth_consent_user_id_idx").on(table.userId),
    ],
);

export const oauthClientAssertion = pgTable("oauth_client_assertion", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
