import getdate from "./toIssoString";
import startTesseract from "./tesseract";

interface Advert {
  title: string,
  description: string,
  url: string,
  price: number,
  author: string,
  date: string, // ISO-8601
  phone: string;
}

interface ArrayAdvert extends Array<Advert>{}

export default async function dataCollection(setting,page,browser){
let flag = true,
counter = 1,
data:ArrayAdvert=[];
let passAuthorization=setting.passAuthorization;

browser.on("targetcreated", async (target) => {
// данный блок перехватывает все новые события
if (target.type() === "page") {
  // и если это новая страница/вкладка
  const page2 = await target.page();

  await page2.once("load", async () => {
    if (`${page2.url()}` != `${setting.link}${counter}`) {
      try {
        let errorPhone = 0;
        if (passAuthorization) {
          try {
            await page2.waitForSelector(
              "div.item-actions  > div:nth-child(1) span > button",
              { timeout: 10000 }
            );
            await page2.click(
              "div.item-actions  > div:nth-child(1) span > button"
            );
            try {
              await page2.waitForSelector(
                "div[data-marker=phone-popup] span img",
                { timeout: 10000 }
              );
            } catch {
              errorPhone = 2;
              console.log("номер временно скрыт");
            }
          } catch {
            errorPhone = 1;
            console.log("пользователь запретил просмотр телефона");
          }

        }
        data.push(
          await page2.evaluate(
            ( {passAuthorization, errorPhone} ) => {
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
             {passAuthorization, errorPhone} 
          )
        );
        data[data.length - 1].date = getdate(data[data.length - 1].date);
        
        if (passAuthorization && !errorPhone)
          data[data.length - 1].phone =await startTesseract(data[data.length - 1].phone);

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
console.log("страница - " + counter + "из" + setting.maxContent);
await page.goto(`${setting.link}${counter}`, {
  waitUntil: "load",
  timeout: 0,
});

console.log("главная-" + page.url());

await page.waitForSelector(
  "div.js-pages > div:nth-child(1) > span:nth-child(8)"
);

if (setting.maxContent == 0) {
  setting.maxContent = +await page.evaluate(():number => {
    return + (<HTMLElement>document.querySelector(
      "div.js-pages > div:nth-child(1) > span:nth-child(8)"
    )).innerText;
  });
} else {
  if (
    setting.maxContent >
    (await page.evaluate(():number => {
      return +(<HTMLElement>document.querySelector(
        "div.js-pages > div:nth-child(1) > span:nth-child(8)"
      )).innerText;
    }))
  ) {
    setting.maxContent = await page.evaluate(():number => {
      return +(<HTMLElement>document.querySelector(
        "div.js-pages > div:nth-child(1) > span:nth-child(8)"
      )).innerText;
    });
  }
}


const elements = await page.$$(
  "div[data-marker=catalog-serp] > div[data-marker=item] a[data-marker=item-title]"
)
for (let i = 0; i < 2; i++) {
  console.log("элемент - " + (i + 1) + "из " + elements.length);
  elements[i].click();
  await page.waitForTimeout(20000);
}

flag = setting.maxContent == counter ? false : true;
counter += 1;
}
return data;
}