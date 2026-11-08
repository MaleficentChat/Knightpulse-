"use strict";

// Official Brand News uses its own PostgreSQL table and API contract.
// It intentionally does not reuse the community-news in-memory collection.
function registerBrandNewsRoutes(app, deps) {
  const { auth, upload, current, hasRank, isUserFeatureBlocked, checkRestrictedMediaUpload, pool, io, cleanText, id } = deps;
  const categories = ["Product update", "Community", "Events", "Service notice", "Behind the scenes"];
  const map = row => ({
    id: String(row.id), category: row.category, headline: row.headline,
    summary: row.summary, body: row.body, linkLabel: row.link_label || "",
    linkUrl: row.link_url || "", createdAt: Number(row.created_at),
    author: row.author || "Maleficent Chat Team", avatar: row.avatar || "",
    image: row.image || null
  });
  const canPublish = user => !!user && hasRank(user, "ADMIN") && !isUserFeatureBlocked(user, "publish_news");

  app.get("/api/brand-news", auth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id,category,headline,summary,body,link_label,link_url,created_at,author,avatar,image FROM brand_news ORDER BY created_at DESC,id DESC LIMIT 100"
      );
      res.json({ items: rows.map(map) });
    } catch (error) {
      console.error("Brand News read failed:", error);
      res.status(500).json({ error: "Could not load Brand News." });
    }
  });

  app.post("/api/brand-news", auth, upload.single("file"), async (req, res) => {
    const user = current(req);
    if (!user) return res.status(401).json({ error: "Login required." });
    if (!canPublish(user)) return res.status(403).json({ error: "Brand News publishing requires Admin rank or higher." });
    try {
      if (await checkRestrictedMediaUpload(req, res, user, req.file)) return;
      const category = String(req.body.category || "").trim();
      const headline = cleanText(req.body.headline || "").trim().slice(0, 120);
      const summary = cleanText(req.body.summary || "").trim().slice(0, 260);
      const body = cleanText(req.body.body || "").trim().slice(0, 5000);
      const linkLabel = cleanText(req.body.linkLabel || "").trim().slice(0, 32);
      const linkUrl = String(req.body.linkUrl || "").trim().slice(0, 500);
      if (!categories.includes(category)) return res.status(400).json({ error: "Choose a valid Brand News category." });
      if (!headline || !summary || !body) return res.status(400).json({ error: "Headline, introduction and announcement are required." });
      if (linkUrl) {
        try { const parsed = new URL(linkUrl); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("scheme"); }
        catch { return res.status(400).json({ error: "Destination must be an http or https URL." }); }
      }
      if (linkLabel && !linkUrl) return res.status(400).json({ error: "Add a destination URL for the button label." });
      const itemId = String(id());
      const image = req.file ? { url: "/uploads/" + req.file.filename, type: req.file.mimetype, name: req.file.originalname } : null;
      const createdAt = Date.now();
      const { rows } = await pool.query(
        `INSERT INTO brand_news(id,category,headline,summary,body,link_label,link_url,created_at,author,avatar,image)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
         RETURNING id,category,headline,summary,body,link_label,link_url,created_at,author,avatar,image`,
        [itemId, category, headline, summary, body, linkLabel, linkUrl, createdAt,
          user.displayName || user.username, user.avatar || "", JSON.stringify(image)]
      );
      io.emit("brand-news");
      res.status(201).json({ item: map(rows[0]) });
    } catch (error) {
      console.error("Brand News publish failed:", error);
      res.status(500).json({ error: "Brand News could not be published. Please try again." });
    }
  });

  app.delete("/api/brand-news/:id", auth, async (req, res) => {
    const user = current(req);
    if (!canPublish(user)) return res.status(403).json({ error: "Removing Brand News requires Admin rank or higher." });
    try {
      const result = await pool.query("DELETE FROM brand_news WHERE id=$1 RETURNING id", [String(req.params.id)]);
      if (!result.rowCount) return res.status(404).json({ error: "Brand News update not found." });
      io.emit("brand-news");
      res.json({ ok: true, id: String(result.rows[0].id) });
    } catch (error) {
      console.error("Brand News delete failed:", error);
      res.status(500).json({ error: "Could not remove this Brand News update." });
    }
  });
}

module.exports = { registerBrandNewsRoutes };
