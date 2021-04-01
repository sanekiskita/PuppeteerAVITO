const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import * as setting from "./settings";
import authorization from "./authorization";

import getdate from "./toIssoString";
import startTesseract from "./tesseract";

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

interface Advert {
    title: string,
    description: string,
    url: string,
    price: number,
    author: string,
    date: string, // ISO-8601
    phone: any;
}

interface ArrayAdvert extends Array<Advert>{}


export default async function startPuppeteer() {
  let data:ArrayAdvert=[];
  let passAuthorization:boolean = setting.passAuthorization;
  let maxContent = setting.maxContent;
  puppeteer.use(StealthPlugin({}));
  const browser = await puppeteer.launch(setting.browser);
  let page = await browser.newPage();
  await page.setBypassCSP(true);
  try {
    if (setting.passAuthorization) {
      await page.goto(setting.link, {
        waitUntil: "load",
        timeout: 0,
      });
      await authorization(page, setting.login, setting.password);
    }

    let flag = true,
      counter = 1;

    browser.on("targetcreated", async (target) => {
      // данный блок перехватывает все новые события
      if (target.type() === "page") {
        // и если это новая страница/вкладка
        const page2 = await target.page();

        await page2.once("load", async () => {
          if (`${page2.url()}` != `${setting.link}${counter}`) {
            try {
              let errorPhone = 0;
              if (setting.passAuthorization) {
                try {
                  await page2.waitForSelector(
                    "div.item-actions  > div:nth-child(1) span > button",
                    { timeout: 5000 }
                  );
                  await page2.click(
                    "div.item-actions  > div:nth-child(1) span > button"
                  );
                } catch {
                  errorPhone = 1;
                  console.log("пользователь запретил просмотр телефона");
                }
                try {
                  await page2.waitForSelector(
                    "div[data-marker=phone-popup] span img",
                    { timeout: 5000 }
                  );
                } catch {
                  errorPhone = 2;
                  console.log("номер временно скрыт");
                }
              }
              data.push(
                await page2.evaluate(
                  ({ passAuthorization, errorPhone }) => {
                    let price =
                      parseFloat(
                        (<HTMLElement>document
                          .querySelector("div.item-price span.price-value-string"))
                          .innerText.replace(/\s/g, "")
                      ) ===
                        parseFloat(
                          (<HTMLElement>document
                            .querySelector("div.item-price span.price-value-string"))
                            .innerText.replace(/\s/g, "")
                        )
                        ? parseFloat(
                          (<HTMLElement>document
                            .querySelector(
                              "div.item-price span.price-value-string"
                            ))
                            .innerText.replace(/\s/g, "")
                        )
                        : 0;
                    let title: string = (<HTMLElement>document.querySelector(".title-info-title-text")).innerText;
                    let description: string = (<HTMLElement>document.querySelector(".item-description")).innerText;
                    let author: string = (<HTMLElement>document.querySelector(".seller-info-name")).innerText;
                    let date: string = (<HTMLElement>document.querySelector(".title-info-metadata-item-redesign")).innerText;

                    let phone;
                    if (passAuthorization) {
                      switch (errorPhone) {
                        case 1:
                          phone = "пользователь запретил просмотр телефона";
                          break;
                        case 2:
                          phone = "номер временно скрыт";
                          break;
                        default:
                          phone = (<HTMLImageElement>document.querySelector(
                            "div[data-marker=phone-popup] span img"
                          )).src;
                      }
                    } else {
                      phone = "вы не авторизированы для получения данных";
                    }
                    let url = document.location.href;
                    return {
                      price,
                      title,
                      description,
                      author,
                      date,
                      phone,
                      url
                    };
                  },
                  { passAuthorization, errorPhone }
                )
              );
              data[data.length - 1].date = getdate(data[data.length - 1].date);
              if (setting.passAuthorization && !errorPhone)
                data[data.length - 1].phone = await startTesseract((data[data.length - 1].phone).toString());
            } catch (e) {
              console.log(e);
              console.log("ошибка у нового окна");
              console.log(await page2.url());
            } finally {
              await page2.close(); // закрываем вкладку

            }
          }
        });

        //
      }
      //
    });

    while (flag) {
      console.log("страница - " + counter + "из" + maxContent);
      await page.goto(`${setting.link}${counter}`, {
        waitUntil: "load",
        timeout: 0,
      });

      console.log("главная-" + page.url());

      await page.waitForSelector(
        "div.js-pages > div:nth-child(1) > span:nth-child(8)"
      );

      if (maxContent == 0) {
        maxContent = await page.evaluate(() => {
          return + (<HTMLElement>document.querySelector(
            "div.js-pages > div:nth-child(1) > span:nth-child(8)"
          )).innerText;
        });
      } else {
        if (
          maxContent >
          (await page.evaluate(() => {
            return +(<HTMLElement>document.querySelector(
              "div.js-pages > div:nth-child(1) > span:nth-child(8)"
            )).innerText;
          }))
        ) {
          maxContent = await page.evaluate(() => {
            return +(<HTMLElement>document.querySelector(
              "div.js-pages > div:nth-child(1) > span:nth-child(8)"
            )).innerText;
          });
        }
      }


      const elements = await page.$$(
        "div[data-marker=catalog-serp] > div[data-marker=item] a[data-marker=item-title]"
      )
      for (let i = 0; i < 1; i++) {
        console.log("элемент - " + (i + 1) + "из " + elements.length);
        elements[i].click();
        await page.waitForTimeout(10000);
      }

      flag = maxContent == counter ? false : true;
      counter += 1;
    }

  } catch (e) {
    console.log(e);
  } finally {
    await browser.close();
    return data;
  }

}

