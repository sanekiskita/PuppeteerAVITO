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
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const setting = require("./settings");
const authorization_1 = require("./authorization");
const toIssoString_1 = require("./toIssoString");
const tesseract_1 = require("./tesseract");
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
function startPuppeteer() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = [];
        let passAuthorization = setting.passAuthorization;
        let maxContent = setting.maxContent;
        puppeteer.use(StealthPlugin({}));
        const browser = yield puppeteer.launch(setting.browser);
        let page = yield browser.newPage();
        yield page.setBypassCSP(true);
        try {
            if (setting.passAuthorization) {
                yield page.goto(setting.link, {
                    waitUntil: "load",
                    timeout: 0,
                });
                yield authorization_1.default(page, setting.login, setting.password);
            }
            let flag = true, counter = 1;
            browser.on("targetcreated", (target) => __awaiter(this, void 0, void 0, function* () {
                if (target.type() === "page") {
                    const page2 = yield target.page();
                    yield page2.once("load", () => __awaiter(this, void 0, void 0, function* () {
                        if (`${page2.url()}` != `${setting.link}${counter}`) {
                            try {
                                let errorPhone = 0;
                                if (setting.passAuthorization) {
                                    try {
                                        yield page2.waitForSelector("div.item-actions  > div:nth-child(1) span > button", { timeout: 5000 });
                                        yield page2.click("div.item-actions  > div:nth-child(1) span > button");
                                    }
                                    catch (_a) {
                                        errorPhone = 1;
                                        console.log("пользователь запретил просмотр телефона");
                                    }
                                    try {
                                        yield page2.waitForSelector("div[data-marker=phone-popup] span img", { timeout: 5000 });
                                    }
                                    catch (_b) {
                                        errorPhone = 2;
                                        console.log("номер временно скрыт");
                                    }
                                }
                                data.push(yield page2.evaluate(({ passAuthorization, errorPhone }) => {
                                    let price = parseFloat(document
                                        .querySelector("div.item-price span.price-value-string")
                                        .innerText.replace(/\s/g, "")) ===
                                        parseFloat(document
                                            .querySelector("div.item-price span.price-value-string")
                                            .innerText.replace(/\s/g, ""))
                                        ? parseFloat(document
                                            .querySelector("div.item-price span.price-value-string")
                                            .innerText.replace(/\s/g, ""))
                                        : 0;
                                    let title = document.querySelector(".title-info-title-text").innerText;
                                    let description = document.querySelector(".item-description").innerText;
                                    let author = document.querySelector(".seller-info-name").innerText;
                                    let date = document.querySelector(".title-info-metadata-item-redesign").innerText;
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
                                                phone = document.querySelector("div[data-marker=phone-popup] span img").src;
                                        }
                                    }
                                    else {
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
                                }, { passAuthorization, errorPhone }));
                                data[data.length - 1].date = toIssoString_1.default(data[data.length - 1].date);
                                if (setting.passAuthorization && !errorPhone)
                                    data[data.length - 1].phone = yield tesseract_1.default((data[data.length - 1].phone).toString());
                            }
                            catch (e) {
                                console.log(e);
                                console.log("ошибка у нового окна");
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
                console.log("страница - " + counter + "из" + maxContent);
                yield page.goto(`${setting.link}${counter}`, {
                    waitUntil: "load",
                    timeout: 0,
                });
                console.log("главная-" + page.url());
                yield page.waitForSelector("div.js-pages > div:nth-child(1) > span:nth-child(8)");
                if (maxContent == 0) {
                    maxContent = yield page.evaluate(() => {
                        return +document.querySelector("div.js-pages > div:nth-child(1) > span:nth-child(8)").innerText;
                    });
                }
                else {
                    if (maxContent >
                        (yield page.evaluate(() => {
                            return +document.querySelector("div.js-pages > div:nth-child(1) > span:nth-child(8)").innerText;
                        }))) {
                        maxContent = yield page.evaluate(() => {
                            return +document.querySelector("div.js-pages > div:nth-child(1) > span:nth-child(8)").innerText;
                        });
                    }
                }
                const elements = yield page.$$("div[data-marker=catalog-serp] > div[data-marker=item] a[data-marker=item-title]");
                for (let i = 0; i < 1; i++) {
                    console.log("элемент - " + (i + 1) + "из " + elements.length);
                    elements[i].click();
                    yield page.waitForTimeout(10000);
                }
                flag = maxContent == counter ? false : true;
                counter += 1;
            }
        }
        catch (e) {
            console.log(e);
        }
        finally {
            yield browser.close();
            return data;
        }
    });
}
exports.default = startPuppeteer;
