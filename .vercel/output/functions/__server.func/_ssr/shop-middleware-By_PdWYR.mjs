import { n as createMiddleware } from "./ssr2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shop-middleware-By_PdWYR.js
/** Shop username + PIN session. Does not use Better Auth cookies. */
var shopMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
	const { requireShopUser } = await import("./shop-session.server-CMUhym2s.mjs");
	return next({ context: { userId: (await requireShopUser()).id } });
});
//#endregion
export { shopMiddleware as t };
