"use strict";

// Notification APIs enforce recipient ownership in every read/write query.
// Warning notices are deliberately excluded from bulk read/delete operations.
function registerNotificationRoutes(app, { auth, pool, current }) {
  const shape = row => ({
    id: String(row.id), type: row.type, title: row.title || row.type,
    text: row.message || "", message: row.message || "",
    time: row.created_at, read: !!row.is_read
  });
  app.get("/api/notifications", auth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id,type,title,message,is_read,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100",
        [Number(current(req).id)]
      );
      res.json({ notifications: rows.map(shape) });
    } catch (error) {
      console.error("Notification list failed:", error);
      res.status(500).json({ error: "Could not load notifications." });
    }
  });
  app.get("/api/notifications/unread", auth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id,type,title,message,is_read,created_at FROM notifications WHERE user_id=$1 AND is_read=false ORDER BY created_at DESC,id DESC LIMIT 100",
        [Number(current(req).id)]
      );
      res.json({ notifications: rows.map(shape) });
    } catch (error) {
      console.error("Unread notification query failed:", error);
      res.status(500).json({ error: "Could not load unread notifications." });
    }
  });
  app.get("/api/warnings/pending", auth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id,type,title,message,is_read,created_at FROM notifications WHERE user_id=$1 AND type='warning' AND is_read=false ORDER BY created_at ASC,id ASC LIMIT 20",
        [Number(current(req).id)]
      );
      res.json({ warnings: rows.map(row => ({ id: String(row.id), type: "warning", text: row.message || "", message: row.message || "", time: row.created_at })) });
    } catch (error) {
      console.error("Pending warning query failed:", error);
      res.status(500).json({ error: "Could not load pending warnings." });
    }
  });
  app.patch("/api/notifications/:id/read", auth, async (req, res) => {
    try {
      const result = await pool.query(
        "UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2 AND type<>'warning' RETURNING id",
        [req.params.id, Number(current(req).id)]
      );
      if (!result.rowCount) return res.status(404).json({ error: "Notification not found or requires warning acknowledgement." });
      res.json({ ok: true });
    } catch (error) {
      console.error("Notification read update failed:", error);
      res.status(500).json({ error: "Could not update this notification." });
    }
  });
  app.post("/api/notifications/:id/acknowledge-warning", auth, async (req, res) => {
    try {
      const result = await pool.query(
        "UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2 AND type='warning' AND is_read=false RETURNING id",
        [req.params.id, Number(current(req).id)]
      );
      if (!result.rowCount) return res.status(404).json({ error: "Warning not found or already acknowledged." });
      res.json({ ok: true });
    } catch (error) {
      console.error("Warning acknowledgement failed:", error);
      res.status(500).json({ error: "Could not acknowledge this warning." });
    }
  });
  app.post("/api/notifications/read", auth, async (req, res) => {
    try {
      await pool.query("UPDATE notifications SET is_read=true WHERE user_id=$1 AND type<>'warning' AND is_read=false", [Number(current(req).id)]);
      res.json({ ok: true });
    } catch (error) {
      console.error("Mark-all-read failed:", error);
      res.status(500).json({ error: "Could not mark notifications as read." });
    }
  });
  app.delete("/api/notifications/:id", auth, async (req, res) => {
    try {
      const result = await pool.query("DELETE FROM notifications WHERE id=$1 AND user_id=$2 AND type<>'warning' RETURNING id", [req.params.id, Number(current(req).id)]);
      if (!result.rowCount) return res.status(404).json({ error: "Notification not found or cannot be removed." });
      res.json({ ok: true });
    } catch (error) {
      console.error("Notification delete failed:", error);
      res.status(500).json({ error: "Could not remove this notification." });
    }
  });
  app.delete("/api/notifications", auth, async (req, res) => {
    try {
      const result = await pool.query("DELETE FROM notifications WHERE user_id=$1 AND type<>'warning' RETURNING id", [Number(current(req).id)]);
      res.json({ ok: true, deleted: result.rowCount });
    } catch (error) {
      console.error("Clear notifications failed:", error);
      res.status(500).json({ error: "Could not clear notifications." });
    }
  });
}
module.exports = { registerNotificationRoutes };
