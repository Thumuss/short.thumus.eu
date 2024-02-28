import { Database } from "bun:sqlite";
import { join } from "path";
const db = new Database(join(__dirname, "../../db/db.sqlite"));

db.run(
`CREATE TABLE IF NOT EXISTS Links (
  Id INTEGER PRIMARY KEY,
  Link TEXT NOT NULL,
  Timestamp INTEGER,
  Last INTEGER DEFAULT 0,
  NbAccess INTEGER DEFAULT 0,
  Max INTEGER DEFAULT -1,
  Access INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS Tokens (
  Id INTEGER PRIMARY KEY,
  Link TEXT NOT NULL,
  Timestamp INTEGER DEFAULT 0,
  Ip TEXT NOT NULL
);
`
);

type INTEGER = number
type TEXT = string

export interface Token {
  Id: INTEGER;
  Code: TEXT;
  Timestamp: INTEGER;
  Ip: TEXT;
}

export interface Link {
  Id: TEXT,
  Link: TEXT,
  Timestamp: INTEGER,
  Last: INTEGER,
  NbAccess: INTEGER,
  Max: INTEGER,
  Access: INTEGER,
}

const transform = (obj: any) => Object.fromEntries(Object.entries(obj).map(a => ["$" + a[0], a[1]]));

export const insertLink = (Link: Link) => db.prepare("INSERT INTO Links (Link, Timestamp, Last, NbAccess, Max) VALUES ($Link, $Timestamp, $Last, $NbAccess, $Max)").get(transform(Link) as any);
export const updateLink = (Link: Link) => db.prepare("UPDATE Links SET Last=$Last, NbAccess=$NbAccess, Max=$Max, Access=$Access").get(transform(Link) as any);
export const deleteLink = (obj: string) => db.prepare<string, string>("DELETE FROM Links WHERE Link=?").run(obj);
export const getLink = (obj: string) => db.prepare("SELECT * FROM Links WHERE Id=?").get(obj) as Link | null;

export const insertToken = (Token: Token) => db.prepare<string, string[]>("INSERT INTO Tokens (Code, Ip) VALUES ()").run(transform(Token) as any);
export const getCodeToken = (obj: string) => db.prepare("SELECT * FROM Tokens WHERE Code=?").get(obj) as Token | null;
export const deleteToken = (obj: string) => db.prepare<string, string>("DELETE FROM Tokens WHERE Code=?").run(obj);
