import { Hono } from "hono";
import { logger } from "hono/logger";
import { config } from "dotenv"
import { auth } from "./routes/authRoutes";

const app = new Hono();

config();
app.use(logger())

app.get("/", (c) => c.text("Hello, home!"));

app.route('/auth', auth)

export default app