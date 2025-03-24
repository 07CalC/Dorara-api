import { getCookie } from "hono/cookie";
import { decodeJwt } from "../utils/decodeJwt";
import { createMiddleware } from "hono/factory";



export const authMiddleware = createMiddleware( async (c, next) => {
    const jwt = getCookie(c, "jwt");
    if (!jwt) {
        return c.json({message: "Unauthorized, no jwt found"}, {status: 401});
    }
    const decoded = await decodeJwt(jwt);
    if (!decoded) {
        return c.json({message: "Unauthorized, wrong jwt"}, {status: 401});
    }
    // c.set("user", decodedJson);
    c.set("user", decoded);
    await next()
})