import { Hono } from "hono";
import { logger } from "hono/logger";
import { config } from "dotenv"
import { auth } from "./routes/authRoutes";
import { authMiddleware } from "./middlewares/authMiddleware";
import { getUser } from "./middlewares/getUser";

const app = new Hono();

config();
app.use(logger())
app.use('/api/',authMiddleware)
app.use(getUser)

app.get("/", async (c) => {
    // console.log(c.get("user"))
    return c.text(JSON.stringify(c.get("user") as string))
});

app.route('/auth', auth)

export default app