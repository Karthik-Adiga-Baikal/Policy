const DEFAULT_BACKEND_AI_URL = "http://localhost:8000";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const normalizeBaseUrl = (value?: string) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return trimTrailingSlash(normalized);
};

export const getBackendAiBaseUrl = () => {
  if (typeof window === "undefined") {
    return (
      normalizeBaseUrl(process.env.BACKEND_AI_URL) ||
      normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_AI_URL) ||
      DEFAULT_BACKEND_AI_URL
    );
  }

  return normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_AI_URL) || DEFAULT_BACKEND_AI_URL;
};

export const buildBackendAiUrl = (path: string) => {
  const baseUrl = getBackendAiBaseUrl();
  let normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Allow env base URL with or without /api to avoid duplicated /api/api.
  if (baseUrl.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    normalizedPath = normalizedPath.slice(4);
  }

  return `${baseUrl}${normalizedPath}`;
};
