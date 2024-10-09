import Fastify from "fastify";
import * as cheerio from "cheerio";

const dumbCache = new Map<string, string>();

const app = Fastify({
  logger: false,
});

app.get("/", async (req, reply) => {
  return reply.status(200).type("text/html").send("OK");
});

app.get<{
  Querystring: { handle: string };
}>("/avatar", async (req, reply) => {
  const { handle } = req.query;

  if (!handle) {
    return reply.code(404).send("Not found");
  }

  const avatar = dumbCache.get(handle) ?? (await grabImage(handle));

  if (!avatar) {
    return reply.code(404).send("Not found");
  }

  const avatarUrl = `${avatar}?width=60&height=60&fit=cover&auto=webp`;
  dumbCache.set(handle, avatarUrl);

  return reply
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

app.listen({ port: process.env.PORT ?? 5555 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
