const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');
const feature = loadFeature('./features/enterStatistics.feature');

let page;
let browser;

defineFeature(feature, test => {

  beforeAll(async () => {
    jest.setTimeout(5000);
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      : await puppeteer.launch({ headless: false, slowMo: 30 });
    page = await browser.newPage();
    setDefaultOptions({ timeout: 5000 });

    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle0" })
      .catch((error) => console.error("Navigation failed:", error));

    await page.click('[data-testid="register-button"]');
    await expect(page).toFill('input[id="username"]', 'testuser');
    await expect(page).toFill('input[id="password"]', 'testuser');
    await page.click('[data-testid="submit-button"]');
    
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Redirecting to login...');
    }, { timeout: 7500 });

    const bodyText = await page.evaluate(() => document.body.textContent);
    expect(bodyText).toContain('Redirecting to login...');

  }, 60000);

  beforeEach(async () => {
    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle0" })
      .catch((error) => console.error("Navigation failed:", error));

    await page.waitForSelector('[data-testid="login-button"]', { timeout: 50000 })
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
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Comenzar');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Comenzar');

      await page.click('[data-testid="account-button"]', { timeout: 2000 });

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Perfil');
      }, { timeout: 7500 });

      const bodyText2 = await page.evaluate(() => document.body.textContent);
      expect(bodyText2).toContain('Perfil');
    });

    and('I press the statistics button', async () => {
      console.log("Pressing the statistics button...");
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          page.click('[data-testid="profile-button"]', { timeout: 3000 }),
        ]);
        console.log("Statistics button pressed and profile page loaded.");
      } catch (error) {
        console.error("error pressing profile button or navigating", error);
        throw new Error("error pressing profile button or navigating");
      }
    });
    

    then(/^I should see the profile page for "(.*)"$/, async (user) => {
      try {
        console.log('Waiting for profile username...');
        await page.waitForSelector('[data-testid="profile-username"]', { timeout: 20000 });
        const profileUsername = await page.$eval('[data-testid="profile-username"]', el => el.textContent.trim());
        expect(profileUsername).toBe(user);
        console.log("Nombre de usuario en el perfil verificado:", profileUsername);
      } catch (error) {
        console.error("Error verifying profile username:", error);
        throw new Error(`Could not find or verify profile username: ${error.message}`);
      }
    });
    
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
});