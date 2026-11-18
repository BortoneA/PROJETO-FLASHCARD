import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve("./audit-screenshots/after");
fs.mkdirSync(OUT_DIR, { recursive: true });

const RESOLUTIONS = [
  { name: "1920x1080_desktop", width: 1920, height: 1080 },
  { name: "1440x900_laptop", width: 1440, height: 900 },
  { name: "1366x768_standard", width: 1366, height: 768 },
  { name: "1024x768_tablet_landscape", width: 1024, height: 768 },
  { name: "768x1024_tablet_portrait", width: 768, height: 1024 },
  { name: "390x844_mobile_iphone", width: 390, height: 844 },
  { name: "360x800_mobile_android", width: 360, height: 800 },
];

async function run() {
  const browser = await chromium.launch();

  // Test across resolutions for Home Page Light
  for (const res of RESOLUTIONS) {
    const page = await browser.newPage({ viewport: { width: res.width, height: res.height } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, `home_light_${res.name}.png`), fullPage: true });
    await page.close();
  }

  // Home Page Dark Mode (Desktop 1440x900 & Mobile 390x844)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.screenshot({ path: path.join(OUT_DIR, `home_dark_1440x900.png`), fullPage: true });
    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.screenshot({ path: path.join(OUT_DIR, `home_dark_390x844.png`), fullPage: true });
    await page.close();
  }

  // Study Page (Desktop & Mobile)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000/study/all", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, `study_light_1440x900.png`), fullPage: true });
    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto("http://localhost:3000/study/all", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, `study_light_390x844.png`), fullPage: true });
    await page.close();
  }

  // OLED Black Mode (Desktop & Mobile)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.classList.add("dark", "oled");
      document.documentElement.setAttribute("data-theme", "oled");
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT_DIR, `home_oled_1440x900.png`), fullPage: true });
    await page.close();
  }

  // Table View Mode (click table view switch button)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    const tableButton = page.locator('button[title*="Tabela"]');
    if (await tableButton.count() > 0) {
      await tableButton.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, `home_table_view_1440x900.png`), fullPage: true });
    }
    await page.close();
  }

  await browser.close();
  console.log("All 'after' redesign screenshots captured in " + OUT_DIR);
}

run().catch(console.error);
