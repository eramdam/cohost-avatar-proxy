import express from "express";

const app = express();

app.get("/", (_req, res) => {
  return res.sendStatus(200);
});

app.get("/avatar/:handle", async (req, res) => {
  const handle = String(req.params.handle);

  if (!handle) {
    return res.status(404).send("Not found");
  }

  const avatar = await grabImage(handle);

  if (!avatar) {
    return res.status(404).send("Not found");
  }

  const avatarUrl = `${avatar}?width=60&height=60&fit=cover&auto=webp`;

  return res
    .header(
      "Cache-Control",
      "public, s-maxage=604800, max-age=3600, stale-while-revalidate=31536000"
    )
    .header("Access-Control-Allow-Origin", req.headers.origin)
    .redirect(avatarUrl);
});

async function grabImage(handle: string): Promise<string | undefined> {
  const page = await fetch(
    `https://cohost.org/api/v1/trpc/projects.byHandle?input="${handle}"`,
    {
      headers: {
        "User-Agent": "cohost-avatar-proxy",
      },
    }
  );
  try {
    const data = await page.json();

    return data.result.data.avatarPreviewURL;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

app.all("*", (req, res) => {
  res.sendStatus(404);
});

app.listen(3000, () => console.log("Server ready on port 3000."));

export default app;
