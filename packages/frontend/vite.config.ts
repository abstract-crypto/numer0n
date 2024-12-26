import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { PolyfillOptions, nodePolyfills } from "vite-plugin-node-polyfills";
import topLevelAwait from "vite-plugin-top-level-await";

// Unfortunate, but needed due to https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/81
// Suspected to be because of the yarn workspace setup, but not sure
const nodePolyfillsFix = (options?: PolyfillOptions | undefined): Plugin => {
	return {
		...nodePolyfills(options),
		/* @ts-ignore */
		resolveId(source: string) {
			const m =
				/^vite-plugin-node-polyfills\/shims\/(buffer|global|process)$/.exec(
					source
				);
			if (m) {
				return `../../node_modules/vite-plugin-node-polyfills/shims/${m[1]}/dist/index.cjs`;
			}
		},
		// exclude: ["fs", "tty", "crypto"],
	};
};

// https://vite.dev/config/
export default defineConfig({
	server: {
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	plugins: [
		react(),
		nodePolyfillsFix({
			include: ["buffer", "process", "path", "crypto", "tty"],
			// exclude: ["fs", "tty", "crypto"],
		}),
		topLevelAwait(),
	],
	optimizeDeps: {
		exclude: [
			"@noir-lang/acvm_js",
			"@noir-lang/noirc_abi",
			"@aztec/bb-prover",
			// "fs",
			// "tty",
			// "crypto",
		],
	},
	resolve: {
		alias: {
			src: "/src",
			// fs: "tiny-node-polyfill/fs", // or simply false
			// tty: false,
			// If needed:
			// crypto: false,
		},
	},
	base: "/",
});