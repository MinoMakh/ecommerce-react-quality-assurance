import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { expect } from "chai";
import path from "path";

const filePath = path.resolve(process.cwd(), "static/nike.jpg");

describe("Admin Add Product", function () {
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

  it("Add New Product Test", async function () {
    await driver.findElement(By.id("email")).sendKeys("alimakhloufj@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("123456789Ali");

    // Submit form
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.sleep(5000);

    await driver
      .findElement(By.css('a.sidenavigation-menu[href="/admin/products"]'))
      .click();

    await driver.sleep(1000);

    const addNewProductButton = await driver.findElement(
      By.xpath("//button[contains(., 'Add New Product')]")
    );

    await addNewProductButton.click();

    // Fill product details
    await driver.findElement(By.id("name")).sendKeys("Nike Pegasus 300");

    const brandInput = await driver.findElement(
      By.id("react-select-brand-input")
    );
    await brandInput.sendKeys("Nike", Key.ENTER);

    await driver.sleep(500);

    const nikeOption = await driver.findElement(
      By.xpath("//div[contains(@class, 'css-') and text()='Nike']")
    );
    await nikeOption.click();

    await driver
      .findElement(By.id("description"))
      .sendKeys("Lightweight running shoes with great cushioning");

    // Remove existing text
    const priceInput = await driver.findElement(By.id("price"));
    await priceInput.sendKeys(Key.chord(Key.CONTROL, "a"));
    await priceInput.sendKeys("150");

    // Remove existing text
    const maxQuantity = driver.findElement(By.id("maxQuantity"));
    await maxQuantity.sendKeys(Key.chord(Key.CONTROL, "a"));
    await maxQuantity.sendKeys("100");

    const fileInput = await driver.findElement(By.id("product-input-file"));

    await driver.executeScript(
      "arguments[0].style.display = 'block';",
      fileInput
    );

    await fileInput.sendKeys(filePath);

    await driver.sleep(1000);

    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.sleep(500);

    const toastSuccess = await driver.wait(
      until.elementLocated(By.className("toast-success")),
      5000,
      "Success toast did not appear within 5 seconds"
    );

    expect(toastSuccess).to.not.be.null;
  });

  after(async () => {
    await driver.quit();
  });
});
