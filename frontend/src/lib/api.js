const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export const apiUrl = (path = "") => {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}/${path.replace(/^\/+/, "")}`;
};

export const assetUrl = (path) => {
  if (!path || typeof path !== "string") return "";
  const value = path.trim();
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;

  // Older records may contain a disk path; serve the same uploaded file via Express.
  const normalized = value.replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");
  const webPath = uploadsIndex >= 0
    ? normalized.slice(uploadsIndex)
    : normalized.startsWith("uploads/")
      ? `/${normalized}`
      : normalized.startsWith("/")
        ? normalized
        : `/${normalized}`;

  return `${API_BASE}${encodeURI(webPath).replace(/#/g, "%23")}`;
};

export default API_BASE;
