import { i as createServerFn } from "./ssr2.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-admin-Cf7s1NH1.js
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("a1986319a819eb849e60e05da5a43bd2386479b09f125ce5a9dddc0af0ca61fb"));
var shopStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("d3a357b4da8bc8d43e1c98f1bb15b65402402efa22db961d3f7ed87a851b6ab3"));
var setupShopLogin = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("f6328df3aecd68446b0a6734ab73447982bdbb5532a54978e59b4558cb7f0c89"));
var pinLogin = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("d42996ad6d4ea6c4def463d676a6989f9cd08bec2321342b0f88bbfe8f547307"));
var pinLogout = createServerFn({ method: "POST" }).handler(createSsrRpc("b79adedaee0e06139cc25cac96d3373a7b879f19acf5ad28291f4c29ae376e04"));
var assignShopPin = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("a5e3cf2657649f336674f20a071f2b91a89cc37d490b122ed603832251079077"));
var createShopUser = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("5c63cb67525d3035681d873181f82540477e0f63492a7cca1cdb6cfda1836d89"));
createServerFn({ method: "GET" }).handler(createSsrRpc("27de1327f4dd795e5296b46546af7f5a461675a757187ee3e257dac6a8b827f9"));
createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("a967907b1dd10518cc81d71b906848f97db5970184472e3b6c16c81405b815dd"));
var setAdminAccessCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("513c5da810d38bf60bc1c1c1762cac3a5c645f0ff3175a575d9ce242b6c31c14"));
var saveAdminEmails = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("fa2d82dd022fe8d3a0bd93251917f88141b79d3e32c0ae9b5d78fb7d01962b9c"));
var setEmployeeRole = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("f67b98a9f222a4a5c5d25407b7ac3f4cd6474a99343dc48121dfee203ab93e0e"));
var getAdminEmails = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("d4246a3e189493476e18caa56a91b82598b4a76507c306fd75d7e1266657e49a"));
var setAccountStatus = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("6ae0ad42dc995273e588da79a5d1588f97790137139aeaf56f2a1de5d52b2168"));
var redeemUnlockCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("9fd8a6cb98a2a2d1684fd065fa94a025a47256cfdea3802e62abc7dccc02be84"));
//#endregion
export { pinLogout as a, setAccountStatus as c, setupShopLogin as d, shopStatus as f, pinLogin as i, setAdminAccessCode as l, createShopUser as n, redeemUnlockCode as o, getAdminEmails as r, saveAdminEmails as s, assignShopPin as t, setEmployeeRole as u };
