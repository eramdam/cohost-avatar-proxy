import * as cheerio from "cheerio";
import express from "express";

const app = express();
const port = process.env.PORT || 8080;

const dumbCache = new Map<string, string>();

app.get("/", (_req, res) => {
  return res.sendStatus(200);
});

app.get("/avatar", async (req, res) => {
  const handle = String(req.query.handle);

  if (!handle) {
    return res.status(404).send("Not found");
  }

  const avatar = dumbCache.get(handle) ?? (await grabImage(handle));

  if (!avatar) {
    return res.status(404).send("Not found");
  }

  const avatarUrl = `${avatar}?width=60&height=60&fit=cover&auto=webp`;
  dumbCache.set(handle, avatarUrl);

  return res
    .header("Cache-Control", "max-age=31536000, stale-while-revalidate=86400")
    .redirect(avatarUrl);
});

async function grabImage(handle: string): Promise<string | undefined> {
  const page = await fetch(`https://cohost.org/${handle}`, {
    headers: {
      "User-Agent": "cohost-avatar-proxy",
    },
  });
  try {
    const html = await page.text();
    const $ = cheerio.load(html);

    const configRaw = $('script[id="__COHOST_LOADER_STATE__"]').text();
    const config = JSON.parse(configRaw);

    return config["project-page-view"].project.avatarPreviewURL;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

app.all("*", (req, res) => {
  res.sendStatus(404);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
