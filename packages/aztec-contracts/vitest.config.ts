import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 120000, // Sets the default timeout to 120 seconds (2 minutes)
		// You can add other test configurations here
	},
});
