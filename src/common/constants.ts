/**
 * @enum {string}
 */
export const ApiErrorTypes = {
  UNAUTHORIZED: "unauthorized",
  SESSION_LIMIT_EXCEEDED: "session_limit_exceeded",
  SESSION_EXPIRED: "session_expired",
};

export const IS_PROD = process.env.NODE_ENV === "production";
export const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://dashboard.sprout-hr.com/element-ai";
export const API_BASE_URL = process.env.API_BASE_URL ?? "https://api.sprout-hr.com/api/v1";
export const FIGMA_OAUTH_CLIENT_ID = "ZnoCj0vPEwDoLR0jimrfMX";
export const FIGMA_OAUTH_CALLBACK_URL = "http://localhost:3080/api/v1/auth/figma-callback";

export const BRAND_NAME = "elementai";

export const AUTH_PROVIDER_ID = `${BRAND_NAME}.auth`;

// file extensions that are supported by the extension
export const SUPPORTED_FILE_EXTENSIONS = [
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".jsx",
  ".tsx",
  ".vue",
  ".svelte",
  ".sass",
  ".less",
  ".styl",
];
