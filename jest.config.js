module.exports = {
  testMatch: [
    "**/steps/*.js",                 
    "**/__tests__/**/*.{js,jsx}",     
    "**/?(*.)+(spec|test).{js,jsx}"    
  ],
  testTimeout: 300000,                 
  setupFilesAfterEnv: ["expect-puppeteer"],

  collectCoverage: true,
  collectCoverageFrom: [
    "webapp/src/**/*.{js,jsx}",        
    "!webapp/src/**/*.test.{js,jsx}",   
    "!webapp/src/**/*.spec.{js,jsx}",   
    "!**/node_modules/**"              
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text"],
};