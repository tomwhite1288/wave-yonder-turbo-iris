import { i as createServerFn } from "./ssr2.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-account-C7rcPmzy.js
var addJobReceipt = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("813052a99e03e5023ce791adb0c13ad3fe2168dc86f3bd7043973716305f8377"));
var attachTicketCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("253c2156fa6880e989098e01bcecc689a686b89ffadbaea3c5c9a86e357c27b6"));
var getAccountabilityWeek = createServerFn({ method: "GET" }).validator((d) => d ?? {}).middleware([shopMiddleware]).handler(createSsrRpc("4638a47ba74d7ea83908fd70c609f834f721b5f42db96ede688c80f548f55b2e"));
var exportWeekPack = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("c9bbb0f2ae2532f570a69ed265523d8163f2ce94e98315ae3516627f253e8394"));
//#endregion
export { getAccountabilityWeek as i, attachTicketCode as n, exportWeekPack as r, addJobReceipt as t };
