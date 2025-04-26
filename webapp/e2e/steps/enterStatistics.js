const puppeteer = require('puppeteer');
 const { defineFeature, loadFeature } = require('jest-cucumber');
 const { setDefaultOptions } = require('expect-puppeteer');
 const feature = loadFeature('./features/enterStatistics.feature');
 
 let page;
 let browser;
 
 defineFeature(feature, test => {
 
   beforeAll(async () => {
     jest.setTimeout(60000);
     browser = process.env.GITHUB_ACTIONS
       ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
       : await puppeteer.launch({ headless: false, slowMo: 30 });
     page = await browser.newPage();
     setDefaultOptions({ timeout: 50000 });
 
     await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
       .catch((error) => console.error("Navigation failed:", error));
 
     await page.click('[data-testid="register-button"]');
     await expect(page).toFill('input[id="username"]', 'testuser');
     await expect(page).toFill('input[id="password"]', 'password');
     await page.click('[data-testid="submit-button"]');
     const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Redirecting to login...');
   }, 3000);
 
   beforeEach(async () => {
     await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
       .catch((error) => console.error("Navigation failed:", error));
 
     await page.waitForSelector('[data-testid="login-button"]', { timeout: 3000 })
       .catch((error) => console.error("Login button not found:", error));
     await page.click('[data-testid="login-button"]');
   });
 
   test('The user wants to access their statistics', ({ given, when, and, then }) => {
 
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
       // Login is already done in the given step
     });
 
     and('I press the statistics button', async () => {
       console.log("Pressing the statistics button...");
       try{
           await page.waitForSelector('[data-testid="profile-button"]', { timeout: 3000 })
           await page.click('[data-testid="profile-button"]');
           await page.waitForNavigation({ waitUntil: 'networkidle0' })
           console.log("Statistics button pressed and profile page loaded.");
       }catch(error){
           console.error("error pressing profile button or navigating", error);
           throw new Error("error pressing profile button or navigating");
       }
     });
 
     then(/^I should see the profile page for "(.*)"$/, async (user) => {
       try {
         await page.waitForFunction(() => {
           const usernameEl = document.querySelector('[data-testid="profile-username"]');
           return usernameEl && usernameEl.textContent.trim().length > 0;
         }, { timeout: 30000 }); // Espera hasta 30s
 
         const pageUsername = await page.$eval('[data-testid="profile-username"]', el => el.textContent);
         await expect(pageUsername).toBe(user);
       } catch (error) {
         console.error("Error finding profile username:", error);
         throw new Error("Profile username element not found.");
       }
     });
   });
 
   afterAll(async () => {
     if (browser) {
       await browser.close();
     }
   });
 });