import { i as createServerFn } from "./ssr2.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-dispatch-DPRVE5QJ.js
var getDispatchDesk = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("2cb077b075826fc62c2a2046f34f009aec2259f3dd93e7b65004bab2f89605b1"));
var createWorkOrder = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("985b56c598ab0bb9ada6869b000b9b30767b67dd3f62b4e00abfe7e9a9d38115"));
var assignWorkOrder = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("d3708a2138e31fb9333cc476efff2821441fc5e1f8d9d51a0fc59853f20b379e"));
createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("2628ed0ee57d25c0004285cb4c83f358987d31a97985b87b6c3ea19506a35d87"));
var setTicketJobKind = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("cb467f284b040d930ea04063216033a878e1c778b138d31eb44f8ec36f927c9f"));
//#endregion
export { setTicketJobKind as i, createWorkOrder as n, getDispatchDesk as r, assignWorkOrder as t };
