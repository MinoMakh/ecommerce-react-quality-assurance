import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

(async function runTest() {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options())
    .build();

  try {
    await driver.get('http://localhost:59087/signin');

    await driver.wait(until.elementLocated(By.name('email')), 10000);
    await driver.findElement(By.name('email')).sendKeys('alice@example.com');
    await driver.findElement(By.name('password')).sendKeys('Firefly1122@');
    await driver.findElement(By.xpath("//button[contains(., 'Login') or contains(., 'Sign In')]")).click();

    await driver.sleep(1000);
    await driver.get('http://localhost:59087/');

    await driver.get('http://localhost:59087/search/test');

    const firstItem = await driver.wait(
      until.elementLocated(By.xpath('//*[@id="app"]/main/section/div[2]/div[1]/div')),
      10000
    );
    await firstItem.click();

    const addToBasketBtn = await driver.wait(
      until.elementLocated(By.xpath('//*[@id="app"]/main/div/div[1]/div[3]/div[4]/button')),
      10000
    );
    await addToBasketBtn.click();

    const updatedButton = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(text(), "Remove From Basket")]')),
      10000
    );

    const updatedText = await updatedButton.getText();
    if (updatedText.includes('Remove From Basket')) {
      console.log('[PASSED] Item successfully added — button changed to "Remove From Basket".');
    } else {
      console.error('Button text did not change after adding item.');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    const image = await driver.takeScreenshot();
    fs.writeFileSync('error-screenshot.png', image, 'base64');
  } finally {
    await driver.quit();
  }
})();
