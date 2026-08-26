import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/book-DsX53fa1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Phone copy is one HTML file hosted on the shop site — not a multi-file app. */
var BOOK_FILE = "/Maichles-Code-Book.html";
function PhoneBookRedirect() {
	(0, import_react.useEffect)(() => {
		window.location.replace(BOOK_FILE);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.16em] text-subtle",
				children: "Maichle's Edge"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-lg font-semibold",
				children: "Code Book"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-sm text-sm text-muted",
				children: "Opening the one-file phone book. iPhone and Android open that single page from the shop site — no extra files."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "mt-4 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg",
				href: BOOK_FILE,
				children: "Open Code Book"
			})
		] })
	});
}
//#endregion
export { PhoneBookRedirect as component };
