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

interface ArrayAdvert extends Array<Advert> {}

/**
 * обрабатывает страницы для получения данных
 *
 * @param  setting настройки.
 * @param  page Открытая страница.
 * @param  browser браузер.
 * @return  массив с данными
 */
export default async function dataCollection(setting, page, browser) {
    let flag: boolean = true,
        counter: number = 1,
        data: ArrayAdvert = [];
    const passAuthorization = setting.passAuthorization;

    browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
            const page2 = await target.page();

            await page2.once('load', async () => {
                if (`${page2.url()}` !== `${setting.link}${counter}`) {
                    try {
                        let errorPhone = 0;
                        if (passAuthorization) {
                            try {
                                await page2.waitForSelector('div.item-actions  > div:nth-child(1) span > button',
                                    { timeout: 10000 }
                                );
                                await page2.click('div.item-actions  > div:nth-child(1) span > button'
                                );
                                try {
                                    await page2.waitForSelector('div[data-marker=phone-popup] span img',
                                        { timeout: 10000 }
                                    );
                                } catch {
                                    errorPhone = 2;
                                    console.log('номер временно скрыт');
                                }
                            } catch {
                                errorPhone = 1;
                                console.log(
                                    'пользователь запретил просмотр телефона'
                                );
                            }
                        }
                        data.push(await page2.evaluate(({ passAuthorization, errorPhone }) => {
                                    const price =parseFloat(((document.querySelector('div.item-price span.price-value-string')
                                            ) as HTMLElement).innerText.replace(/\s/g, '')) ===
                                            parseFloat(((document.querySelector('div.item-price span.price-value-string'
                                            )) as HTMLElement).innerText.replace(/\s/g, ''))
                                            ? parseFloat(((document.querySelector('div.item-price span.price-value-string')) as HTMLElement).innerText.replace(
                                               /\s/g, '')): 0;
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
                    } catch (e) {
                        console.log(e);
                        console.log('ошибка у нового окна');
                        console.log(await page2.url());
                    } finally {
                        await page2.close();
                    }
                }
            });
        }
    });

    while (flag) {
        console.log('страница - ' + counter + 'из' + setting.maxContent);
        await page.goto(`${setting.link}${counter}`, {
            waitUntil: 'load',
            timeout: 0,
        });

        console.log('главная-' + page.url());

        await page.waitForSelector(
            'div.js-pages > div:nth-child(1) > span:nth-child(8)'
        );

        if (setting.maxContent === 0) {
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

        const elements = await page.$$(
            'div[data-marker=catalog-serp] > div[data-marker=item] a[data-marker=item-title]'
        );
        for (let i = 0; i < elements.length; i++) {
            console.log('элемент - ' + (i + 1) + 'из ' + elements.length);
            elements[i].click();
            await page.waitForTimeout(20000);
        }
        flag = setting.maxContent === counter ? false : true;
        counter += 1;
    }
    return data;
}
