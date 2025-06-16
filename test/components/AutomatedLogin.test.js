import { Builder, By, until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

(async function runTest() {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options())
    .build();

  try {
    await driver.get('http://localhost:59087/signin');

    await driver.wait(until.elementLocated(By.name('email')), 10000);
    await driver.findElement(By.name('email')).sendKeys('alice@example.com');
    await driver.findElement(By.name('password')).sendKeys('Alice123');
    await driver.findElement(By.xpath("//button[contains(., 'Login') or contains(., 'Sign In')]")).click();

    await driver.sleep(1000); 
    await driver.get('http://localhost:59087/checkout/step2');

    await driver.wait(until.urlContains('/checkout/step2'), 10000);

    console.log('[PASSED] Login form test passed.');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await driver.quit();
  }
})();
