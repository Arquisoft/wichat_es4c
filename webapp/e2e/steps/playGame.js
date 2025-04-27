const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');

const feature = loadFeature('./features/playGame.feature');

let page;
let browser;

defineFeature(feature, test => {

  beforeAll(async () => {
    jest.setTimeout(60000); // más tiempo para entornos lentos
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      : await puppeteer.launch({ headless: false, slowMo: 30 });
    page = await browser.newPage();
    setDefaultOptions({ timeout: 5000 });

    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
      .catch((error) => console.error("Navigation failed:", error));

    await page.click('[data-testid="register-button"]');
    await expect(page).toFill('input[id="username"]', 'test');
    await expect(page).toFill('input[id="password"]', 'test');
    await page.click('[data-testid="submit-button"]');

    await page.waitForFunction(() => {
      return document.body.innerText.includes('Redirecting to login...');
    }, { timeout: 7500 });

    const bodyText = await page.evaluate(() => document.body.textContent);
    expect(bodyText).toContain('Redirecting to login...');
  });

  beforeEach(async () => {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
      .catch((error) => console.error("Navigation failed:", error));

    await page.waitForSelector('[data-testid="login-button"]', { timeout: 50000 })
      .catch((error) => console.error("Login button not found:", error));
    await page.click('[data-testid="login-button"]');
  });

  test('The user plays a game with his own game values and logs out', ({ given, when, and, then }) => {
    let username;
    let password;

    given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
      username = user;
      password = pwd;
      await expect(page).toFill('input[id="username"]', username);
      await expect(page).toFill('input[id="password"]', password);
      await page.click('[data-testid="submit-button"]');
    });

    when('The user logs in with the user credentials', async () => {
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Comenzar');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Comenzar');
    });

    and('The user presses the account button', async () => {
      await page.click('[data-testid="account-button"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Ajustes');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Ajustes');
    });

    and('The user presses the settings button', async () => {
      await page.click('[data-testid="settings-button"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Ajustes del Juego');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Ajustes del Juego');
    });

    and('The user changes the value number of questions to 2', async () => {
      const input = await page.waitForSelector('input[name="questionAmount"]');
      await input.click({ clickCount: 3 });
      await page.keyboard.type('2');
    });

    and('The user saves the changes', async () => {
      const saveButton = await page.waitForSelector('[data-testid="save-settings-button"]');
      await saveButton.click();

      await page.waitForFunction(() => {
        return document.body.innerText.includes('¡Ajustes guardados con éxito!');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('¡Ajustes guardados con éxito!');
    });

    and('The user presses the play button', async () => {
      const playButton = await page.waitForSelector('[data-testid="play-button"]');
      await playButton.click();

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Salir al menú principal');
      }, { timeout: 7500 });
    });

    and('The user answers the first question', async () => {
      try {
        const firstQuestionXPath = '//*[@id="root"]/div/div[1]/div/div[1]/div/div[2]/div[1]/button';
        
        await page.waitForXPath(firstQuestionXPath, {
          visible: true,
          timeout: 20000
        });
    
        // Obtener el botón con reintentos
        const [firstButton] = await page.$x(firstQuestionXPath);
        if (!firstButton) {
          throw new Error('Primer botón no encontrado');
        }
    
        await firstButton.evaluate(btn => btn.scrollIntoView());
        await page.waitForTimeout(500);
        await firstButton.click();
    
        await page.waitForFunction(
          () => !document.querySelector('[data-testid="answer-option"]:not([disabled])'),
          { timeout: 15000 }
        );
      } catch (error) {
        console.error('Error en primera pregunta:', error);
        throw error;
      }
    });
    
    and('The user answers the second question', async () => {
      try {
        await page.waitForTimeout(3000);
    
        const secondQuestionXPath = '//*[@id="root"]/div/div[1]/div/div[1]/div/div[2]/div[1]/button';
        
        await page.waitForXPath(secondQuestionXPath, {
          visible: true,
          timeout: 20000
        });
    
        const [secondButton] = await page.$x(secondQuestionXPath);
        if (!secondButton) {
          throw new Error('Segundo botón no encontrado');
        }
    
        await secondButton.evaluate(btn => {
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(500);
        await secondButton.click();
    
        await page.waitForFunction(
          () => document.body.innerText.includes('¡Resumen de la partida!'),
          { timeout: 20000 }
        );
      } catch (error) {
        const pageContent = await page.content();
        console.error('Contenido de la página:', pageContent);
        throw error;
      }
    });
    
    and(/^The game ends and the message "(.*)" is shown$/, async (msg) => {
      await page.waitForFunction(
        (expectedMsg) => {
          const text = document.body.innerText;
          return text.includes(expectedMsg);
        },
        { timeout: 10000 },
        msg
      );
    
      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain(msg);
    });

    and('The user presses the go menu button', async () => {
      try {
        // Intenta usar texto en lugar del data-testid
        await page.waitForFunction(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some(button => 
            button.textContent.includes('Volver al menú') || 
            button.textContent.includes('menu') ||
            button.textContent.includes('Start Menu') ||
            button.textContent.includes('Menu')
          );
        }, { timeout: 10000 });
        
        // Encuentra el botón por texto
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const menuButton = buttons.find(button => 
            button.textContent.includes('Volver al menú') || 
            button.textContent.includes('menu') ||
            button.textContent.includes('Start Menu') ||
            button.textContent.includes('Menu')
          );
          if (menuButton) menuButton.click();
        });
        
        // Esperar a que vuelva al menú principal
        await page.waitForFunction(() => {
          return document.body.innerText.includes('Comenzar');
        }, { timeout: 10000 });
      } catch (error) {
        console.error('Error al presionar botón de menú:', error);
        
        // Intentar obtener todos los botones para diagnóstico
        const buttonTexts = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(b => b.textContent);
        });
        console.log('Botones disponibles:', buttonTexts);
        
        throw error;
      }
    });

    and('The user presses the account button', async () => {
      await page.click('[data-testid="account-button"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Ajustes');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Ajustes');
    });

    and('The user presses the logout button', async () => {
      try {
        await page.click('[data-testid="logout-button"]');
        
        // Esperar a que vuelva a la página de login
        await page.waitForFunction(() => {
          return document.body.innerText.includes('WICHAT');
        }, { timeout: 10000 });
      } catch (error) {
        console.error('Error al presionar botón de logout:', error);
        throw error;
      }
    });

    then('The home page is shown', async () => {
      await page.waitForFunction(() => {
        return document.body.innerText.includes('WICHAT');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('WICHAT');
    });
  });

  test('The user plays a game and the statistics are saved', ({ given, when, and, then }) => {
    let username;
    let password;

    given(/^A user with name "(.*)" and password "(.*)"$/, async (user, pwd) => {
      username = user;
      password = pwd;
      await expect(page).toFill('input[id="username"]', username);
      await expect(page).toFill('input[id="password"]', password);
      await page.click('[data-testid="submit-button"]');
    });

    when('The user logs in with the user credentials', async () => {
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Comenzar');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Comenzar');
    });

    and('The user presses the play button', async () => {
      const playButton = await page.waitForSelector('[data-testid="play-button"]');
      await playButton.click();

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Salir al menú principal');
      }, { timeout: 7500 });
    });

    and('The user answers the first question', async () => {
      try {
        const firstQuestionXPath = '//*[@id="root"]/div/div[1]/div/div[1]/div/div[2]/div[1]/button';
        
        await page.waitForXPath(firstQuestionXPath, {
          visible: true,
          timeout: 20000
        });
    
        // Obtener el botón con reintentos
        const [firstButton] = await page.$x(firstQuestionXPath);
        if (!firstButton) {
          throw new Error('Primer botón no encontrado');
        }
    
        await firstButton.evaluate(btn => btn.scrollIntoView());
        await page.waitForTimeout(500);
        await firstButton.click();
    
        await page.waitForFunction(
          () => !document.querySelector('[data-testid="answer-option"]:not([disabled])'),
          { timeout: 15000 }
        );
      } catch (error) {
        console.error('Error en primera pregunta:', error);
        throw error;
      }
    });
    
    and('The user answers the second question', async () => {
      try {
        await page.waitForTimeout(3000);
    
        const secondQuestionXPath = '//*[@id="root"]/div/div[1]/div/div[1]/div/div[2]/div[1]/button';
        
        await page.waitForXPath(secondQuestionXPath, {
          visible: true,
          timeout: 20000
        });
    
        const [secondButton] = await page.$x(secondQuestionXPath);
        if (!secondButton) {
          throw new Error('Segundo botón no encontrado');
        }
    
        await secondButton.evaluate(btn => {
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(500);
        await secondButton.click();
    
        await page.waitForFunction(
          () => document.body.innerText.includes('¡Resumen de la partida!'),
          { timeout: 20000 }
        );
      } catch (error) {
        const pageContent = await page.content();
        console.error('Contenido de la página:', pageContent);
        throw error;
      }
    });
    
    and(/^The game ends and the message "(.*)" is shown$/, async (msg) => {
      await page.waitForFunction(
        (expectedMsg) => {
          const text = document.body.innerText;
          return text.includes(expectedMsg);
        },
        { timeout: 10000 },
        msg
      );
    
      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain(msg);
    });

    and('The user presses the go menu button', async () => {
      try {
        // Intenta usar texto en lugar del data-testid
        await page.waitForFunction(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some(button => 
            button.textContent.includes('Volver al menú') || 
            button.textContent.includes('menu') ||
            button.textContent.includes('Start Menu') ||
            button.textContent.includes('Menu')
          );
        }, { timeout: 10000 });
        
        // Encuentra el botón por texto
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const menuButton = buttons.find(button => 
            button.textContent.includes('Volver al menú') || 
            button.textContent.includes('menu') ||
            button.textContent.includes('Start Menu') ||
            button.textContent.includes('Menu')
          );
          if (menuButton) menuButton.click();
        });
        
        // Esperar a que vuelva al menú principal
        await page.waitForFunction(() => {
          return document.body.innerText.includes('Comenzar');
        }, { timeout: 10000 });
      } catch (error) {
        console.error('Error al presionar botón de menú:', error);
        
        // Intentar obtener todos los botones para diagnóstico
        const buttonTexts = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(b => b.textContent);
        });
        console.log('Botones disponibles:', buttonTexts);
        
        throw error;
      }
    });

    and('The user presses the account button', async () => {
      await page.click('[data-testid="account-button"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Ajustes');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Ajustes');
    });

    and('The user presses the profile button', async () => {
      await page.click('[data-testid="profile-button"]');

      await page.waitForFunction(() => {
        return document.body.innerText.includes('Jugador activo');
      }, { timeout: 7500 });

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toContain('Jugador activo');
    });

    then('The user played games statistic is 2', async () => {
      // Esperar y obtener el texto del elemento
      const statText = await page.waitForFunction(() => {
        const el = document.querySelector('[data-testid="games-played"]');
        return el && el.textContent.trim();
      }, { timeout: 15000 });
    
      // Verificar que contiene el número 2
      expect(statText.toString()).toContain('2');
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
});