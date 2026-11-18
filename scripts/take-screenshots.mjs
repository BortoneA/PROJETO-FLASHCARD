import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve("./audit-screenshots/before");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch();

  // Desktop Light
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-light-home.png"), fullPage: true });
    await page.close();
  }

  // Desktop Dark
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    // Click dark mode if needed or verify dark class
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-dark-home.png"), fullPage: true });
    await page.close();
  }

  // Mobile (iPhone 14 / modern Android 390x844)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "mobile-light-home.png"), fullPage: true });
    await page.close();
  }

  // Study Mode
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000/study/all", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "study-light.png"), fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log("Screenshots captured successfully in " + OUT_DIR);
}

run().catch(console.error);
