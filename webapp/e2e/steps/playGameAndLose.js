const puppeteer = require('puppeteer');
 const { defineFeature, loadFeature } = require('jest-cucumber');
 const { setDefaultOptions } = require('expect-puppeteer');
 const feature = loadFeature('./features/playGameAndLose.feature');
 
 let page;
 let browser;
 
 defineFeature(feature, test => {
 
   beforeAll(async () => {
     jest.setTimeout(60000);
     browser = process.env.GITHUB_ACTIONS
       ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
       : await puppeteer.launch({ headless: false, slowMo: 10 });
     page = await browser.newPage();
     setDefaultOptions({ timeout: 50000 });
 
     await page
       .goto("http://localhost:3000", {
         waitUntil: "networkidle0",
       })
       .catch((error) => {
         console.error("Navigation failed:", error);
       });
 
     await page.click('[data-testid="register-button"]');
     await expect(page).toFill('input[id="username"]', 'admin');
     await expect(page).toFill('input[id="password"]', 'admin');
     await page.click('[data-testid="submit-button"]');
     await expect(page).toMatchElement('div', { text: 'User added successfully' });
   }, 60000);
 
   beforeEach(async () => {
     await page.goto("http://localhost:3000", {
       waitUntil: "networkidle0",
     }).catch((error) => {
       console.error("Navigation failed:", error);
     });
 
     await page.click('[data-testid="login-button"]');
   });
 
   test('The user wants to play a game and lose', ({ given, when, and, then }) => {
 
     let username;
     let password;
 
     given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
       username = user;
       password = pwd;
       await expect(page).toFill('input[id="username"]', username);
       await expect(page).toFill('input[id="password"]', password);
       await page.click('[data-testid="submit-button"]');
     });
 
     when('I log in with the user credentials', async () => {
       // Login is already done in the given step, no need to repeat.
     });
 
     and('I press the play button', async () => {
       await page.waitForSelector('[data-testid="play-button"]');
       await page.click('[data-testid="play-button"]');
     });
 
     and('The game starts and user can see the counter "Tiempo restante"', async () => {
       // Espera a que el contador "Tiempo restante" esté presente en la página
       await page.waitForSelector('#counter');
 
       // Extrae el texto del elemento "#counter"
       const contadorTexto = await page.$eval('#counter', el => el.textContent);
 
       // Realiza la aserción con el texto extraído
       await expect(contadorTexto).toContain('Tiempo restante');
     });
 
     and('I play the game and lose', async () => {
       try {
         await page.click('[data-testid="wrong-answer-button"]');
       } catch (e) {
         console.log("no wrong answer button");
       }
     });
 
     then('The game ends', async () => {
       await expect(page).toMatch("Game Over");
     });
   });
 
   afterAll(async () => {
     if (browser) {
       await browser.close();
     }
   });
 });