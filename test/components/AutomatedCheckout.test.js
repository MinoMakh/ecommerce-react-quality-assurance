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
    await driver.get('http://localhost:59087/checkout/step2');

    const fullnameInput = await driver.wait(until.elementLocated(By.xpath('//*[@id="fullname"]')), 10000);
    await fullnameInput.sendKeys(Key.chord(Key.CONTROL, 'a')); 
    await fullnameInput.sendKeys('Alice Johnson');             

    const emailInput = await driver.findElement(By.xpath('//*[@id="email"]'));
    await emailInput.sendKeys(Key.chord(Key.CONTROL, 'a'));
    await emailInput.sendKeys('alice@example.com');

    const addressInput = await driver.findElement(By.xpath('//*[@id="address"]'));
    await addressInput.clear();
    await addressInput.sendKeys('Russia');

    const mobileInput = await driver.wait(
      until.elementLocated(By.xpath('//*[@id="app"]/main/div/div[2]/form/div[1]/div/div[2]/div[2]/div/div/input')),
      10000
    );
    await driver.executeScript("arguments[0].value = '';", mobileInput);
    await mobileInput.sendKeys('0595237162');

    await driver.sleep(5000);
    const nextButton = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", nextButton);
    await driver.sleep(500);
    await nextButton.click();

    await driver.wait(until.urlContains('/checkout/step3'), 10000);


    console.log('[PASSED] Login and checkout form test passed.');
  } catch (error) {
    console.error('Test failed:', error.message);

    const image = await driver.takeScreenshot();
    fs.writeFileSync('error-screenshot.png', image, 'base64');
  } finally {
    await driver.quit();
  }
})();
