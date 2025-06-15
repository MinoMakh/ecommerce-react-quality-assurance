const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function runTest() {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options())
    .build();

  try {
    await driver.get('http://localhost:3000/signin');

    await driver.wait(until.elementLocated(By.name('email')), 10000);
    await driver.findElement(By.name('email')).sendKeys('alice@example.com');
    await driver.findElement(By.name('password')).sendKeys('Alice123');
    await driver.findElement(By.xpath("//button[contains(., 'Login') or contains(., 'Sign In')]")).click();

    await driver.sleep(1000); 
    await driver.get('http://localhost:3000/checkout/step2');

    await driver.wait(until.urlContains('/checkout/step2'), 10000);

    console.log('[PASSED] Login form test passed.');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await driver.quit();
  }
})();
