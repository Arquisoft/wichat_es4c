module.exports = {
    testMatch: ["**/steps/*.js", "**/__tests__/**/*.{js,jsx}", "**/?(*.)+(spec|test).{js,jsx}"],
    testTimeout: 30000,
    setupFilesAfterEnv: ["expect-puppeteer"],
    collectCoverage: true,
    collectCoverageFrom: [
        "webapp/src/**/*.{js,jsx}",
        "!webapp/src/**/*.test.{js,jsx}",
        "!webapp/src/**/*.spec.{js,jsx}"
    ],
    coverageReporters: ["lcov", "text"]
};
