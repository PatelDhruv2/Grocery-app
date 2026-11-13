const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiUrl = (path) => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

export const assetUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE}${path}`;
};

export default API_BASE;
