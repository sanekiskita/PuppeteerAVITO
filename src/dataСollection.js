"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const toIssoString_1 = require("./toIssoString");
const tesseract_1 = require("./tesseract");
function dataCollection(setting, page, browser) {
    return __awaiter(this, void 0, void 0, function* () {
        let flag = true, counter = 1, data = [];
        const passAuthorization = setting.passAuthorization;
        browser.on('targetcreated', (target) => __awaiter(this, void 0, void 0, function* () {
            if (target.type() === 'page') {
                const page2 = yield target.page();
                yield page2.once('load', () => __awaiter(this, void 0, void 0, function* () {
                    if (`${page2.url()}` !== `${setting.link}${counter}`) {
                        try {
                            let errorPhone = 0;
                            if (passAuthorization) {
                                try {
                                    yield page2.waitForSelector('div.item-actions  > div:nth-child(1) span > button', { timeout: 10000 });
                                    yield page2.click('div.item-actions  > div:nth-child(1) span > button');
                                    try {
                                        yield page2.waitForSelector('div[data-marker=phone-popup] span img', { timeout: 10000 });
                                    }
                                    catch (_a) {
                                        errorPhone = 2;
                                        console.log('номер временно скрыт');
                                    }
                                }
                                catch (_b) {
                                    errorPhone = 1;
                                    console.log('пользователь запретил просмотр телефона');
                                }
                            }
                            data.push(yield page2.evaluate(({ passAuthorization, errorPhone }) => {
                                const price = parseFloat((document.querySelector('div.item-price span.price-value-string')).innerText.replace(/\s/g, '')) ===
                                    parseFloat((document.querySelector('div.item-price span.price-value-string')).innerText.replace(/\s/g, ''))
                                    ? parseFloat((document.querySelector('div.item-price span.price-value-string')).innerText.replace(/\s/g, '')) : 0;
                                const title = (document.querySelector('.title-info-title-text')).innerText;
                                const description = (document.querySelector('.item-description')).innerText;
                                const author = (document.querySelector('.seller-info-name')).innerText;
                                const date = (document.querySelector('.title-info-metadata-item-redesign')).innerText;
                                let phone;
                                if (passAuthorization) {
                                    switch (errorPhone) {
                                        case 1:
                                            phone = 'пользователь запретил просмотр телефона';
                                            break;
                                        case 2:
                                            phone = 'номер временно скрыт';
                                            break;
                                        default: phone = (document.querySelector('div[data-marker=phone-popup] span img')).src;
                                    }
                                }
                                else {
                                    phone = 'вы не авторизированы для получения данных';
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
                            }, { passAuthorization, errorPhone }));
                            data[data.length - 1].date = toIssoString_1.default(data[data.length - 1].date);
                            if (passAuthorization && !errorPhone)
                                data[data.length - 1].phone = yield tesseract_1.default(data[data.length - 1].phone);
                        }
                        catch (e) {
                            console.log(e);
                            console.log('ошибка у нового окна');
                            console.log(yield page2.url());
                        }
                        finally {
                            yield page2.close();
                        }
                    }
                }));
            }
        }));
        while (flag) {
            console.log('страница - ' + counter + 'из' + setting.maxContent);
            yield page.goto(`${setting.link}${counter}`, {
                waitUntil: 'load',
                timeout: 0,
            });
            console.log('главная-' + page.url());
            yield page.waitForSelector('div.js-pages > div:nth-child(1) > span:nth-child(8)');
            if (setting.maxContent === 0) {
                setting.maxContent = +(yield page.evaluate(() => {
                    return +(document.querySelector('div.js-pages > div:nth-child(1) > span:nth-child(8)')).innerText;
                }));
            }
            else {
                if (setting.maxContent >
                    (yield page.evaluate(() => {
                        return +(document.querySelector('div.js-pages > div:nth-child(1) > span:nth-child(8)')).innerText;
                    }))) {
                    setting.maxContent = yield page.evaluate(() => {
                        return +(document.querySelector('div.js-pages > div:nth-child(1) > span:nth-child(8)')).innerText;
                    });
                }
            }
            const elements = yield page.$$('div[data-marker=catalog-serp] > div[data-marker=item] a[data-marker=item-title]');
            for (let i = 0; i < elements.length; i++) {
                console.log('элемент - ' + (i + 1) + 'из ' + elements.length);
                elements[i].click();
                yield page.waitForTimeout(20000);
            }
            flag = setting.maxContent === counter ? false : true;
            counter += 1;
        }
        return data;
    });
}
exports.default = dataCollection;
