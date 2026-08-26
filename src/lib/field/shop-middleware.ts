import { createMiddleware } from "@tanstack/react-start";

/** Shop username + PIN session. Does not use Better Auth cookies. */
export const shopMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { requireShopUser } = await import("./shop-session.server");
  const user = await requireShopUser();
  return next({ context: { userId: user.id } });
});

export { shopMiddleware as authMiddleware };
