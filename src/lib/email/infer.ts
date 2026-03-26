export function inferCompanyAndRoleFromEmail(subject: string, from: string): {
  company: string;
  role: string;
} {
  const fromDomain = from.split("@")[1]?.split(".")[0] || "Unknown";

  const parts = subject
    .split(/[-–—]/g)
    .map((p) => p.trim())
    .filter(Boolean);

  // Heuristic: role is the last segment.
  const role = parts.length > 1 ? parts[parts.length - 1] : "Unknown";

  // Heuristic: company is the first segment if it looks like a company name.
  const company = parts[0] && parts[0].length <= 40 ? parts[0] : fromDomain;

  return { company, role };
}

