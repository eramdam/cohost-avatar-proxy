import Fastify from "fastify";
import * as cheerio from "cheerio";

const app = Fastify({
  logger: true,
});

app.get("/", async (req, reply) => {
  return reply.status(200).type("text/html").send("OK");
});

app.get("/avatar", async (req, reply) => {
  const { handle } = req.query;

  if (!handle) {
    return reply.code(404).send("Not found");
  }

  const avatar = await grabImage(handle);

  if (!avatar) {
    return reply.code(404).send("Not found");
  }

  const avatarUrl = `${avatar}?width=60&height=60&fit=cover&auto=webp`;

  return reply.redirect(avatarUrl);
});

async function grabImage(handle) {
  const page = await fetch(`https://cohost.org/${handle}`, {
    headers: {
      "User-Agent": "cohost-avatar-proxy",
    },
  });
  try {
    const html = await page.text();
    const $ = cheerio.load(html);

    return $('meta[property="og:image"]').attr("content");
  } catch (e) {
    return undefined;
  }
}

export default async function handler(req, reply) {
  await app.ready();
  app.server.emit("request", req, reply);
}
