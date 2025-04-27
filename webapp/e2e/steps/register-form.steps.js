const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');
const feature = loadFeature('./features/register-form.feature');

let page;
let browser;

defineFeature(feature, test => {

  beforeAll(async () => {
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      : await puppeteer.launch({ headless: false, slowMo: 30 });
    page = await browser.newPage();
    setDefaultOptions({ timeout: 10000 });
  });

  // Función auxiliar para navegar a la página principal
  const navigateToHomePage = async () => {
    try {
      await page.goto("http://localhost:3000", {
        waitUntil: "networkidle0",
      });
    } catch (error) {
      console.error("Error navigating to the page:", error);
      throw error;
    }
  };

  // Función auxiliar para navegar a la página de registro
  const navigateToRegisterPage = async () => {
    try {
      await navigateToHomePage();
      await page.waitForSelector('[data-testid="register-button"]', { visible: true, timeout: 5000 });
      await page.click('[data-testid="register-button"]');
      await page.waitForSelector('input[id="username"]', { visible: true, timeout: 5000 });
    } catch (error) {
      console.error("Error navigating to register page:", error);
      throw error;
    }
  };

  beforeEach(async () => {
    // Antes de cada escenario, navega a la página principal
    await page.goto("http://localhost:3000", {
      waitUntil: "networkidle0",
    });
  });

  test('The user is not registered in the site', ({ given, when, then }) => {
    let username;
    let password;

    given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
      username = user;
      password = pwd;
      await navigateToRegisterPage();
    });

    when('The user fills the data in the form and press submit', async () => {
      await expect(page).toFill('input[id="username"]', username);
      await expect(page).toFill('input[id="password"]', password);
      await page.click('[data-testid="submit-button"]');
    });

    then(/^The confirmation message "(.*)" should be shown in the screen$/, async (msg) => {
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Redirecting to login...');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Redirecting to login...');
    });
  });

  test('The user is not registered in the site but the user name is not valid', ({ given, when, then }) => {
    let username;
    let password;

    given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
      username = user;
      password = pwd;
      await navigateToRegisterPage();
    });

    when('The user fills the data in the form and press submit', async () => {
      await expect(page).toFill('input[id="username"]', username);
      await expect(page).toFill('input[id="password"]', password);
      await page.click('[data-testid="submit-button"]');
    });

    then(/^The message "(.*)" should be shown in the screen$/, async (msg) => {
      // Wait for the error message to appear
      await page.waitForFunction(
        (expectedMessage) => {
          // Buscar el mensaje de error en los textos de ayuda (helperText)
          const helperTexts = Array.from(document.querySelectorAll('.MuiFormHelperText-root'));
          return helperTexts.some(element => element.textContent.includes(expectedMessage));
        },
        { timeout: 5000 },
        msg
      );
      
      // Verificar que el mensaje de error está presente
      const helperTexts = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.MuiFormHelperText-root'));
        return elements.map(el => el.textContent);
      });
      
      expect(helperTexts.some(text => text.includes(msg))).toBeTruthy();
    });
  });

  test('The user is not registered in the site but the password is not valid', ({ given, when, then }) => {
    let username;
    let password;

    given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
      username = user;
      password = pwd;
      await navigateToRegisterPage();
    });

    when('The user fills the data in the form and press submit', async () => {
      await expect(page).toFill('input[id="username"]', username);
      await expect(page).toFill('input[id="password"]', password);
      await page.click('[data-testid="submit-button"]');
    });

    then(/^The message "(.*)" should be shown in the screen$/, async (msg) => {
      // Wait for the error message to appear
      await page.waitForFunction(
        (expectedMessage) => {
          // Buscar el mensaje de error en los textos de ayuda (helperText)
          const helperTexts = Array.from(document.querySelectorAll('.MuiFormHelperText-root'));
          return helperTexts.some(element => element.textContent.includes(expectedMessage));
        },
        { timeout: 5000 },
        msg
      );
      
      // Verificar que el mensaje de error está presente
      const helperTexts = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.MuiFormHelperText-root'));
        return elements.map(el => el.textContent);
      });
      
      expect(helperTexts.some(text => text.includes(msg))).toBeTruthy();
    });
  });

  test('The user is not registered in the site but the username is already taken', ({ given, when, then }) => {
    let username;
    let password;

    given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
      username = user;
      password = pwd;
      await navigateToRegisterPage();
    });

    when('The user fills the data in the form and press submit', async () => {
      await expect(page).toFill('input[id="username"]', username);
      await expect(page).toFill('input[id="password"]', password);
      await page.click('[data-testid="submit-button"]');
    });

    then(/^The message "(.*)" should be shown in the screen$/, async (msg) => {
      // Esperar a que aparezca el mensaje de error en un Snackbar
      await page.waitForFunction(
        (expectedMessage) => {
          // Buscar el mensaje de error en los Snackbar o en cualquier parte del texto del cuerpo
          const snackbars = Array.from(document.querySelectorAll('.MuiSnackbar-root'));
          if (snackbars.some(element => element.textContent.includes(expectedMessage))) {
            return true;
          }
          
          // Si no encontramos el mensaje en los Snackbars, buscar en todo el cuerpo
          return document.body.innerText.includes(expectedMessage);
        },
        { timeout: 5000 },
        msg
      );
      
      // Verificar que el mensaje de error está presente
      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain(msg);
    });
  });

  afterAll(async () => {
    await browser.close();
  });

});