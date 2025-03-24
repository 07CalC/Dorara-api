import { createMiddleware } from "hono/factory";
import { decodeJwt } from "../utils/decodeJwt";
import { getCookie } from "hono/cookie";



export const getUser = createMiddleware( async (c, next) => {
    const jwt = getCookie(c, "jwt");
    if (!jwt) {
        console.log("no jwt found")
        await next()
        return
    }
    const decoded = await decodeJwt(jwt as string);
    if (!decoded) {
        await next()
        return
    }
    // const prisma = new PrismaClient();
    // const user = await prisma.user.findUnique({
    //     where: {
    //         id: decoded.id
    //     }
    // })
    c.set("user", decoded);
    await next()
}
)