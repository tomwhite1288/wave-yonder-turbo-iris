import { i as createServerFn } from "./ssr2.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-CRRtNY9Y.js
var getSessionProfile = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("c3d525e043d6b61c0bf50a82a3a69ad7548fd6a88c52449214c683573a1694f5"));
createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("62fee2aeb2864ddc063a080a1b0c3d52b4ac6a742bc571e63ed84a2f310c401e"));
var getFieldToday = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("c6ba80b8a1d3cb8b95daabef258d15f26693bbef0351d946784529860114452b"));
var listJobs = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("ca9ee1ce288c1279c5bac6b92ed4ddb082c52a67da24e1090359774b89df24c3"));
var getJob = createServerFn({ method: "GET" }).validator((ticketId) => ticketId).middleware([shopMiddleware]).handler(createSsrRpc("21205be9b1be19a8cb2b5ee5e1e30d0868c99dfcf3032a96c261bca4d778a518"));
var pingGps = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("ce2efa6d87b2adccd171e5811a11375e2439af92dbea4bc0bfb22dbaef4b5d48"));
createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("3d2862191d396d332e0240acd582f7dea9eccdf092126cae67e33fb9ee2a1adc"));
var clockOut = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("93de9bb59259f2c41992208449ed5eb1be3e02a7c52c31a2e8dd761dc27c266f"));
var transitionClock = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("f96102af49c440d93707d503656f9bbeab9154d126816192d3181952c420e913"));
var submitNote = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("6449f0984301b58d559512761a0ce5d8c9540d7fb1eefb26e9e240da90ebe86b"));
var setJobSiteToHere = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createSsrRpc("4e8808c3c2610a4fd119cf4fcfef8537efe974b8e49065909744693dfda458f2"));
var listPeople = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(createSsrRpc("25a1be0e9153568fb1c96f600a9ca88bac71a41fe19404b2118888bb21ffb44b"));
//#endregion
export { listJobs as a, setJobSiteToHere as c, getSessionProfile as i, submitNote as l, getFieldToday as n, listPeople as o, getJob as r, pingGps as s, clockOut as t, transitionClock as u };
