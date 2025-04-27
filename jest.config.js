module.exports = {
    testMatch: [
      "**/steps/*.js",                  // tus tests e2e Puppeteer
      "**/__tests__/**/*.{js,jsx}",      // tests de componentes unitarios
      "**/?(*.)+(spec|test).{js,jsx}"    // *.spec.js, *.test.jsx, etc.
    ],
    testTimeout: 30000,                  // tiempo de espera extendido (especialmente para e2e)
    setupFilesAfterEnv: ["expect-puppeteer"],
  
    collectCoverage: true,
    collectCoverageFrom: [
      "webapp/src/**/*.{js,jsx}",         // todos tus archivos de código fuente
      "!webapp/src/**/*.test.{js,jsx}",   // excluye archivos de test
      "!webapp/src/**/*.spec.{js,jsx}",   // excluye archivos de spec
      "!**/node_modules/**"               // excluye node_modules
    ],
    coverageDirectory: "coverage",       // dónde generar el informe (por defecto)
    coverageReporters: ["lcov", "text"],  // formatos necesarios para SonarCloud
  };
  
