import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-Db937Ikd.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-admin-DypS8IQV.js
var getAdminLoginMeta = createServerFn({ method: "GET" }).handler(createSsrRpc("27de1327f4dd795e5296b46546af7f5a461675a757187ee3e257dac6a8b827f9"));
var claimAdministrator = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("a967907b1dd10518cc81d71b906848f97db5970184472e3b6c16c81405b815dd"));
var setAdminAccessCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("513c5da810d38bf60bc1c1c1762cac3a5c645f0ff3175a575d9ce242b6c31c14"));
var saveAdminEmails = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("fa2d82dd022fe8d3a0bd93251917f88141b79d3e32c0ae9b5d78fb7d01962b9c"));
var setEmployeeRole = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createSsrRpc("f67b98a9f222a4a5c5d25407b7ac3f4cd6474a99343dc48121dfee203ab93e0e"));
var getAdminEmails = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d4246a3e189493476e18caa56a91b82598b4a76507c306fd75d7e1266657e49a"));
//#endregion
export { setAdminAccessCode as a, saveAdminEmails as i, getAdminEmails as n, setEmployeeRole as o, getAdminLoginMeta as r, claimAdministrator as t };
