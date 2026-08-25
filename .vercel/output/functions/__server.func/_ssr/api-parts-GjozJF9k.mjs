import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-Db937Ikd.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-parts-GjozJF9k.js
var searchParts = createServerFn({ method: "GET" }).validator((d) => d ?? {}).middleware([authMiddleware]).handler(createSsrRpc("551116927a92bed51a1a62bb8838d679586249f152809936ba656c13cfd5665a"));
var getTruck = createServerFn({ method: "GET" }).validator((d) => d ?? {}).middleware([authMiddleware]).handler(createSsrRpc("c2c453b7b2852786da7f5acaa111bb98f392187270822d43c21f2f1d928403f6"));
var useTruckPart = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("4ae9066a8531e109d498e31c21cfb490728ac41bd3f62c6325fda9e42812c7d8"));
var replenishTruck = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("85db1286bf6ffaa2d8c89fd99ab26b893b8f56355e47ca989e30936e95144fc6"));
//#endregion
export { useTruckPart as i, replenishTruck as n, searchParts as r, getTruck as t };
