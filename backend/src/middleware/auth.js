import jwt from "jsonwebtoken";
import { can } from "../lib/permissions.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }
  const token = header.slice("Bearer ".length);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, email, name, role }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Usage: requirePermission("vehicles:write")
export function requirePermission(action) {
  return (req, res, next) => {
    if (!can(req.user?.role, action)) {
      return res.status(403).json({ error: `Role '${req.user?.role}' cannot perform '${action}'.` });
    }
    next();
  };
}
