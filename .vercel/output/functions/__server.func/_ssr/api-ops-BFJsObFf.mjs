import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-Db937Ikd.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-ops-BFJsObFf.js
var listTimecards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("560810467f473d691fb067993069b4005a50a6d027fb11e208f1cf5bf16c885d"));
createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("184389976b0ce472901a7a4ccab022bba41b0621787ee1ff9617d4d194719ae9"));
var approveTimecard = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("9b32f60b2ff20b9b3b71c111419ac34e416840cb36cea3d214655b72e7731fec"));
var listExceptions = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1c1a30c9bdb9be3ccc201cea2f36d3708c9575dc71a20aaff06fffb4df40f6a6"));
var resolveException = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("e3fd0dfced984b8d01dffe0025fc7fb7657f6463534d337747cbd68d196a7e53"));
var getPayroll = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("79bbec6755a276eee7d668dc588b6b3204f22551bd73b3dee9d8516cdcd49513"));
var getEfficiency = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("77bcda31d66d1c4dc6300b9f0c700d827fee6664ef096523fac7b45a888280bc"));
var listCodes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("946684875afbdcab2a31b8c3c1578f39ce244715507cf71fa4558a9b87db84d1"));
var upsertCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("bff7d2bb32176a5adb23e489b638d226532a4660f106ef486620e19fe5504bc0"));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8d885e5438c55f22de99dd6a6778dc9a1edf8c75ca6dd28b6abefcac0b9f16f5"));
var saveSettings = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("ebd2a930ea41a21ce9210409f24fbe353273fb76ed3edbbdcdc30acee0c5a3e3"));
var listAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1b178e5f25a2b40350f3c9d572b4eef9be7b41bbb2af662b14b2a842754c4260"));
var getSchedules = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("feb96307b17402618353ca8fe9b6ff7557c21bfce9a398367376237c7585bf53"));
var getReports = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("43e3c00542fb7ed62857a4c3cf09cca15a5fb37b98e788c2c35dbf460d7390b9"));
//#endregion
export { getSchedules as a, listCodes as c, resolveException as d, saveSettings as f, getReports as i, listExceptions as l, getEfficiency as n, getSettings as o, upsertCode as p, getPayroll as r, listAudit as s, approveTimecard as t, listTimecards as u };
