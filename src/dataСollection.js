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
const { Cluster } = require('puppeteer-cluster');
const toIssoString_1 = require("./toIssoString");
const tesseract_1 = require("./tesseract");
function dataCollection(setting, page, puppeteer, sessid) {
    return __awaiter(this, void 0, void 0, function* () {
        let flag = true;
        let counter = 1;
        const data = [];
        const passAuthorization = setting.passAuthorization;
        const cluster = yield Cluster.launch({
            puppeteerOptions: setting.browser,
            puppeteer,
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 4,
            timeout: 500000,
            monitor: true,
            retryLimit: 1,
            retryDelay: 5000,
            workerCreationDelay: 100
        });
        if (passAuthorization) {
            const Cookie = ({ page, data: sessid }) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield page.setDefaultNavigationTimeout(0);
                    yield page.goto("https://www.avito.ru");
                    yield page.setCookie({ name: 'sessid', value: sessid });
                    yield page.setCookie({ name: 'auth', value: '1' });
                    console.log("Cookie установленны");
                }
                catch (e) {
                    console.log("Куки не установленны");
                    console.log(e);
                }
            });
            try {
                yield cluster.queue(sessid, Cookie);
                yield cluster.idle();
            }
            catch (e) {
                throw new Error("Куки не установленны");
            }
        }
        yield cluster.task(({ page, data: dataArray }) => __awaiter(this, void 0, void 0, function* () {
            try {
                try {
                    yield page.setDefaultNavigationTimeout(50000);
                    yield page.goto(dataArray.url, { waitUntil: 'domcontentloaded' });
                    let error;
                    try {
                        error = yield page.evaluate(() => {
                            return document.querySelector('h2.firewall-title').textContent;
                        });
                    }
                    catch (e) { }
                    if (!!error)
                        throw new Error(error);
                }
                catch (e) {
                    throw new Error('Ошибка загрузки');
                }
                try {
                    let errorPhone = 0;
                    if (passAuthorization) {
                        try {
                            yield page.waitForSelector('div.item-actions  > div:nth-child(1) span > button', { timeout: 20000 });
                            yield page.click('div.item-actions  > div:nth-child(1) span > button');
                            try {
                                yield page.waitForSelector('div[data-marker=phone-popup] span img', { timeout: 20000 });
                            }
                            catch (_a) {
                                errorPhone = 2;
                            }
                        }
                        catch (_b) {
                            errorPhone = 1;
                        }
                    }
                    data.push(yield page.evaluate(({ passAuthorization, errorPhone }) => {
                        const zaprPrice = (document.querySelector('div.item-price span.price-value-string')).innerText.replace(/\s/g, '').slice(0, -1);
                        console.log(zaprPrice);
                        const price = isNaN(Number(zaprPrice))
                            ? 0 : Number(zaprPrice);
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
                    throw new Error('Ошибка в обработке данных');
                }
            }
            catch (e) {
                throw new Error(e.message + " " + dataArray.url);
            }
        }));
        cluster.on('taskerror', (err, data, willRetry = true) => {
            console.log(`${err.message}`);
        });
        try {
            if (setting.maxContent <= 0) {
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
            while (flag) {
                if (`${setting.link}${counter}` !== `${page.url()}`)
                    yield page.goto(`${setting.link}${counter}`, {
                        waitUntil: 'domcontentloaded',
                        timeout: 0,
                    });
                yield page.waitForSelector('div.js-pages > div:nth-child(1) > span:nth-child(8)');
                const elements = yield page.$$('div[data-marker=catalog-serp] > div[data-marker=item] a[data-marker=item-title]');
                let aHref;
                elements.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    aHref = yield page.evaluate(a => a.getAttribute('href'), element);
                    cluster.queue({ 'url': `https://www.avito.ru${aHref}`, 'sessid': sessid });
                }));
                flag = setting.maxContent === counter ? false : true;
                counter += 1;
            }
            yield cluster.idle();
            yield cluster.close();
            console.log("Выход");
        }
        catch (e) {
            console.log(e);
            console.log("ошибка кластера");
            yield cluster.close();
        }
        return data;
    });
}
exports.default = dataCollection;
