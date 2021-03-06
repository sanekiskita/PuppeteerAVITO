const { Cluster } = require('puppeteer-cluster');

import getdate from './toIssoString';
import startTesseract from './tesseract';

interface Advert {
    title: string;
    description: string;
    url: string;
    price: number;
    author: string;
    date: string; // ISO-8601
    phone: string;
}

type ArrayAdvert = Advert[];

/**
 * обрабатывает страницы для получения данных
 *
 * @param  setting настройки.
 * @param  page Открытая страница.
 * @param  browser браузер.
 * @return  массив с данными
 */
export default async function dataCollection(setting, page, puppeteer,sessid) {
    let flag: boolean = true;
    let counter: number = 1;
    const data: ArrayAdvert = [];
    const passAuthorization = setting.passAuthorization;

    const cluster = await Cluster.launch({
        puppeteerOptions : setting.browser,
        puppeteer,
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 4,
        timeout: 500000,
        monitor: true,
        retryLimit:1,
        retryDelay:5000, // через сколько возвращаться  к заданию после провала
        // sameDomainDelay:0, // ожидание между запросами к одному домену
        workerCreationDelay:100 // задержка между потоками
      });

      cluster.on('taskerror', (err, data,willRetry=true) => {
        console.log(`${err.message}`);
    });

      if(passAuthorization){
    const Cookie =  async({page,data: sessid }) => {
        try{
        await page.setDefaultNavigationTimeout(0);
        await page.goto("https://www.avito.ru");
        await page.setCookie({name: 'sessid', value: sessid});
        await page.setCookie({name: 'auth', value: '1'});
        console.log("Cookie установленны");
    }catch(e){
        console.log("Куки не установленны");
        console.log(e);
    }
    }
    try{    await cluster.queue(sessid,Cookie);
        await cluster.idle();
    }catch(e){throw new Error("Куки не установленны");
    }

}
    await cluster.task(async ({page,data: dataArray }) => {
        try {
        try{
            await page.setDefaultNavigationTimeout(50000);
            await page.goto(dataArray.url, {waitUntil: 'domcontentloaded'});
            let error;
            try{
            error = await page.evaluate(() => {
                return document.querySelector('h2.firewall-title').textContent;
            })}catch(e){}

            if(!!error)
            throw new Error(error);
        }catch(e){
            throw new Error('Ошибка загрузки');
        }
        try{
                    let errorPhone = 0;
                    if (passAuthorization) {
                        try {
                            await page.waitForSelector('div.item-actions  > div:nth-child(1) span > button'
                            ,{ timeout: 20000 }
                            );
                            await page.click('div.item-actions  > div:nth-child(1) span > button'
                            );
                            try {
                                await page.waitForSelector('div[data-marker=phone-popup] span img'
                                ,{ timeout: 20000 }
                                );
                            } catch {
                                errorPhone = 2;
                                // console.log('номер временно скрыт');
                            }
                        } catch {
                            errorPhone = 1;
                            /*console.log(
                                'пользователь запретил просмотр телефона'
                            );*/
                        }
                    }
                    data.push(await page.evaluate(({ passAuthorization, errorPhone }) => {
                           const zaprPrice = ((document.querySelector('div.item-price span.price-value-string')
                        ) as HTMLElement).innerText.replace(/\s/g, '').slice(0, -1);
                        console.log(zaprPrice);
                        const price = isNaN(Number(zaprPrice))
                        ? 0 :Number(zaprPrice);
                                const title: string = ((document.querySelector('.title-info-title-text')) as HTMLElement).innerText;
                                const description: string = ((document.querySelector('.item-description')) as HTMLElement).innerText;
                                const author: string = ((document.querySelector('.seller-info-name')) as HTMLElement).innerText;
                                const date: string = ((document.querySelector('.title-info-metadata-item-redesign')) as HTMLElement).innerText;
                                let phone;
                                if (passAuthorization) {
                                    switch (errorPhone) {
                                        case 1:phone ='пользователь запретил просмотр телефона';break;
                                        case 2:phone = 'номер временно скрыт';break;
                                        default:phone = ((document.querySelector('div[data-marker=phone-popup] span img')) as HTMLImageElement).src;
                                    }
                                } else {
                                    phone ='вы не авторизированы для получения данных';
                                }
                                const url = document.location.href;
                                return {
                                    price,
                                    title,
                                    description,
                                    author,
                                    date,
                                    phone,
                                    url,
                                };
                            },
                            { passAuthorization, errorPhone }
                        )
                    );
                    data[data.length - 1].date = getdate(
                        data[data.length - 1].date
                    );

                    if (passAuthorization && !errorPhone)
                        data[data.length - 1].phone = await startTesseract(
                            data[data.length - 1].phone
                        );
                        }catch(e)
                        {
                            throw new Error('Ошибка в обработке данных');
                        }
                } catch (e) {
                    throw new Error(e.message +" "+dataArray.url);
                }
      });

      try{
      if (setting.maxContent <= 0) {
        setting.maxContent = +(await page.evaluate((): number => {
            return +((document.querySelector('div.js-pages > div:nth-child(1) > span:nth-child(8)')) as HTMLElement).innerText;
        }));
    } else {
        if (
            setting.maxContent >
            (await page.evaluate((): number => {
                return +((document.querySelector('div.js-pages > div:nth-child(1) > span:nth-child(8)')) as HTMLElement).innerText;
            }))
        ) {
            setting.maxContent = await page.evaluate((): number => {
                return +((document.querySelector('div.js-pages > div:nth-child(1) > span:nth-child(8)')) as HTMLElement).innerText;
            });
        }
    }

    while (flag) {
         if(`${setting.link}${counter}`!==`${page.url()}`)
        await page.goto(`${setting.link}${counter}`, {
            waitUntil: 'domcontentloaded',
            timeout: 0,
        });

        await page.waitForSelector(
            'div.js-pages > div:nth-child(1) > span:nth-child(8)'
        );
        const elements = await page.$$(
            'div[data-marker=catalog-serp] > div[data-marker=item] a[data-marker=item-title]'
        );
        let aHref:string;

        elements.forEach(async element => {
            aHref = await page.evaluate(a => a.getAttribute('href'), element);
            cluster.queue({'url' : `https://www.avito.ru${aHref}`, 'sessid':sessid});
        });
        flag = setting.maxContent === counter ? false : true;
        counter += 1;
    }
    await cluster.idle();
    await cluster.close();
    console.log("Выход");
    }catch(e){
        console.log(e);
        console.log("ошибка кластера");
        await cluster.close();
    }
    return data;

}
