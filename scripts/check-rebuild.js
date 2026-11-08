"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = path => fs.readFileSync(path, "utf8");
const server = read("server.js");
const db = read("db.js");
const brand = read("brand-news-routes.js");
const notifications = read("notification-routes.js");
const app = read("public/app.js");

assert.match(server, /registerBrandNewsRoutes\(app,/);
assert.match(server, /registerNotificationRoutes\(app,/);
assert.doesNotMatch(server, /db\.brandNews\s*\?\?=/,
  "Brand News must not be stored in the transient in-memory state");
assert.match(db, /CREATE TABLE IF NOT EXISTS brand_news/);
assert.match(brand, /INSERT INTO brand_news/);
assert.match(brand, /DELETE FROM brand_news WHERE id=\$1/);
assert.match(brand, /hasRank\(user, "ADMIN"\)/,
  "Brand News publishing must require Admin rank or higher");
assert.match(brand, /isUserFeatureBlocked\(user, "publish_news"\)/);
assert.match(notifications, /WHERE user_id=\$1 ORDER BY created_at DESC/);
assert.match(notifications, /WHERE id=\$1 AND user_id=\$2/);
assert.match(notifications, /type<>'warning'/,
  "bulk notification actions must preserve warning notices");
assert.match(notifications, /acknowledge-warning/);
assert.match(app, /__mcBrandNewsPublishBound/);
assert.match(app, /data-notif-type/);
assert.match(app, /acknowledge-warning/);
console.log("Rebuild regression checks passed.");
