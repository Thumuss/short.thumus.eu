/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { type Token, getLink } from "./db";

const app = new Hono<{
  Variables: { payload: Token; parsed: any; ip: string };
}>();

app.get("/:id", async (c, next) => {
  const id = c.req.param("id");
  const obj = getLink(id);
  if (!obj || !obj.Access) {
    return c.json({ error: "Not found" });
  }
});

app.use("*", async (c, next) => {
  const jwt = c.req.raw.headers.get("Authorization")?.split?.(" ");
  c.set("parsed", jwt);
  c.set("ip", c.req.raw.headers.get("x-forwarded-for") || "");
  if (!jwt) return await next();
  if (jwt[0] != "Bearer") {
    c.status(401);
    return c.json({ error: "Bad Header" });
  }
  verify(jwt[1], process.env.secretJWT || generate(256, true))
    .then((payload) => c.set("payload", payload))
    .catch(() => {})
    .finally(async () => await next());
});

app.use("*", async (c, next) => {
  if (!c.get("payload")) {
    c.status(403);
    return c.json({ error: "You need to login" });
  }
  await next();
});

function generate(i = 8, complexe = false) {
  const alp =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmopqrstuvwxyz0123456789" + complexe
      ? "$£*µù%^¨&é(-è_çà)~#{[|@]}"
      : "";
  return new Array(i)
    .fill(undefined)
    .map(() => alp[Math.round(Math.random() * alp.length)])
    .join("");
}

export default app;
