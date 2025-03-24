import { sign } from "hono/jwt"
import { env } from "./env"


export const generateJwt = (payload: any) => {
    return sign(payload, env.JWT_SECRET!)
} 