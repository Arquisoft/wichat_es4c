const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions
const feature = loadFeature('./features/register-form.feature');

let page;
let browser;

defineFeature(feature, test => {
  
  beforeAll(async () => {
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      : await puppeteer.launch({ headless: false, slowMo: 10 });
    page = await browser.newPage();
    //Way of setting up the timeout
    setDefaultOptions({ timeout: 10000 })

    await page
      .goto("http://localhost:3000", {
        waitUntil: "networkidle0",
      })
      .catch(() => {});
  });

  test('The user is not registered in the site', ({given, when, then}) => {
    
    let username;
    let password;

    given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
      username = user
      password = pwd
      await page.click('[data-testid="register-button"]');
    });

    when('I fill the data in the form and press submit', async () => {
      await expect(page).toFill('input[id="username"]', username);
      await expect(page).toFill('input[id="password"]', password);
      await page.click('[data-testid="submit-button"]');
    });

    then(/^The confirmation message "(.*)" should be shown in the screen$/, async (msg) => {
      await expect(page).toMatchElement("div", { text: msg });
    });
  })

  afterAll(async () => {
    browser.close()
  })

});