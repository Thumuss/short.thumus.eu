/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { type Token, getLink, getCodeToken, deleteToken, type TokenBase, insertToken, getTokenRefresh } from "./db";

const secretCode = process.env.secretJWT || generate(256, true);

const maxTime = 1000 * 60 * 60 * 8;
const canCreateToken = true;

const app = new Hono<{
  Variables: { payload: Token; parsed: string[] | undefined; ip: string };
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
  if (!jwt || jwt.length < 2 || jwt.length > 2 || jwt[0] != "Bearer")
    return await next();
  verify(jwt[1], secretCode)
    .then((payload) => c.set("payload", payload))
    .catch(() => {})
    .finally(async () => await next());
});

app.post("/token", async (c) => {
  if (!canCreateToken) {
    c.status(403);
    return c.json({ error: "You can't create token" });
  }

  const token: TokenBase = {
    Code: generate(64),
    Refresh: generate(64),
    Timestamp: Date.now()
  }

  insertToken(token);

  c.status(200)
  return c.json({ token: token.Code, refresh_token: token.Refresh });
});

app.put("/token/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: ""});
  const refresh = getTokenRefresh(id);
  if (!refresh) return c.json({ error: "" });
  
  deleteToken(refresh.Code)

  const token: TokenBase = {
    Code: generate(64),
    Refresh: generate(64),
    Timestamp: Date.now()
  }

  insertToken(token);

  c.status(200)
  return c.json({ token: token.Code, refresh_token: token.Refresh });
})

app.use("*", async (c, next) => {
  const token = c.get("payload");
  if (!token) {
    c.status(403);
    return c.json({ error: "You need to login" });
  }
  if (Date.now() - token.Timestamp > maxTime) {
    deleteToken(token.Code);
    c.status(403);
    return c.json({ error: "Token expired" });
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
