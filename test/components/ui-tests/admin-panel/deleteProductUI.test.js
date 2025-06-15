import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { expect } from "chai";
import path from "path";

const filePath = path.resolve(process.cwd(), "static/nike.jpg");

describe("Admin Delete Product", function () {
  let driver;
  this.timeout(30000);

  before(async () => {
    const options = new chrome.Options().addArguments(
      "--window-size=1920,1080"
    );
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
    await driver.get("http://localhost:59087/signin");
  });

  it("Delete Product Test", async function () {
    await driver.findElement(By.id("email")).sendKeys("alimakhloufj@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("123456789Ali");

    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.sleep(5000);

    await driver
      .findElement(By.css('a.sidenavigation-menu[href="/admin/products"]'))
      .click();
    await driver.sleep(1000);

    const deleteButton = await driver.findElement(
      By.xpath("//button[contains(text(),'Delete')]")
    );

    await driver.executeScript("arguments[0].click();", deleteButton);

    const confirmationButton = await driver.findElement(
      By.xpath("//button[contains(text(),'Yes')]")
    );
    await confirmationButton.click();

    const toastSuccess = await driver.wait(
      until.elementLocated(By.className("toast-msg")),
      5000,
      "Success toast did not appear within 5 seconds"
    );

    expect(toastSuccess).to.not.be.null;
  });

  after(async () => {
    await driver.quit();
  });
});
