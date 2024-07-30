import { Hono } from "hono"
import api from "./api"

const app = new Hono();

app.route("/api", api);

console.log("* Starting...")

export default { 
    port: 3000, 
    fetch: app.fetch, 
} 