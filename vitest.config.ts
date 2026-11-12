import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        // AUTM-1786: hit-testing tests run in a real browser, under
        // vitest.browser.config.ts (`pnpm test:browser`), never in jsdom.
        exclude: [...configDefaults.exclude, "src/**/*.browser.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "lcov"],
            include: [
                "src/lib/cn.ts",
                "src/components/Button.tsx",
                "src/components/PhoneCountries.ts",
            ],
            thresholds: {
                "src/lib/cn.ts": {
                    statements: 100, branches: 100, functions: 100, lines: 100,
                },
            },
        },
    },
});
