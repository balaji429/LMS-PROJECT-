// In-memory API request throttling middleware.
export function rateLimit({ windowMs = 15 * 60 * 1000, limit = 100 } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let record = clients.get(key);
    if (!record || now >= record.expiresAt) {
      record = { count: 0, expiresAt: now + windowMs };
      clients.set(key, record);
    }
    record.count += 1;
    res.setHeader("RateLimit-Limit", limit);
    res.setHeader("RateLimit-Remaining", Math.max(0, limit - record.count));
    if (record.count > limit) return res.status(429).json({ message: "Too many requests. Please try again later." });
    if (clients.size > 10000) for (const [clientIp, item] of clients) if (now >= item.expiresAt) clients.delete(clientIp);
    next();
  };
}
