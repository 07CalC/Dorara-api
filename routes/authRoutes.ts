import { Hono, type Context } from "hono";
import { env } from "../utils/env";
import { generateJwt } from "../utils/generateJwt";
import { setCookie } from "hono/cookie";
import { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

export const auth = new Hono();

auth.get("/google", (c: Context) => {
  const authorizationUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
  );
  authorizationUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
  authorizationUrl.searchParams.set(
    "redirect_uri",
    "http://localhost:3000/auth/callback"
  );
  authorizationUrl.searchParams.set("prompt", "consent");
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("access_type", "offline");
  c.redirect(authorizationUrl.toString());
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl.toString(),
    },
  });
});

auth.get("/callback", async (c: Context) => {
  const code = new URL(c.req.raw.url).searchParams.get("code");
  if (!code) {
    return c.text("No code found");
  }
  try {
    const tokenEndpoint = new URL("https://accounts.google.com/o/oauth2/token");
    tokenEndpoint.searchParams.set("code", code);
    tokenEndpoint.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
    tokenEndpoint.searchParams.set("client_secret", env.GOOGLE_CLIENT_SECRET!);
    tokenEndpoint.searchParams.set(
      "redirect_uri",
      "http://localhost:3000/auth/callback"
    );
    tokenEndpoint.searchParams.set("grant_type", "authorization_code")
    const tokenResponse = await fetch(
      tokenEndpoint.origin + tokenEndpoint.pathname,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenEndpoint.searchParams.toString(),
      }
    );
    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const userInfo: any = await userInfoResponse.json();
    const tokenPayload = JSON.stringify(userInfo);
    const prisma = new PrismaClient()

    let user = await prisma.user.findFirst({
      where: {
        email: userInfo.email || ""
      }
    })
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        }
      })
    }
    const jwt = await generateJwt(user);
    setCookie(c, "jwt", jwt, {
        httpOnly: true,
        secure: env.NODE_ENV !== 'development',
        sameSite: env.NODE_ENV === 'development' ? 'lax' : 'none',
        maxAge: 60*60*24*30,
        path: '/',
    });
    
    return new Response(tokenPayload, {
      status: 200,
      headers: {
        "Set-Cookie": `jwt=${jwt}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=3600`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return c.text("Error: " + err);
  }
});
