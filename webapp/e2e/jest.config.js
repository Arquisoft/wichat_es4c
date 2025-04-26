module.exports = {
    testMatch: ["**/steps/*.js", "**/__tests__/**/*.{js,jsx}", "**/?(*.)+(spec|test).{js,jsx}"],
    testTimeout: 30000,
    setupFilesAfterEnv: ["expect-puppeteer"],
    collectCoverage: true,
    collectCoverageFrom: [
        "webapp/src/**/*.{js,jsx}",
        "!**/node_modules/**",
        "!**/*.test.{js,jsx}"
    ],
    coverageReporters: ["lcov", "text"]
}
