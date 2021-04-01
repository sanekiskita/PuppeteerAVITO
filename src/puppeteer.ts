const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import * as setting from './settings';
import authorization from './authorization';
import dataСollection from './dataСollection';

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

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
 * Возвращает массив с данными.
 *
 * @return {array} данные с сайта.
 */
export default async function startPuppeteer() {
    let data: ArrayAdvert = [];
    puppeteer.use(StealthPlugin({}));
    const browser = await puppeteer.launch(setting.browser);
    let page = await browser.newPage();
    await page.setBypassCSP(true);
    try {
        if (setting.passAuthorization) {
            await page.goto(setting.link, {
                waitUntil: 'load',
                timeout: 0,
            });
            await authorization(page, setting.login, setting.password);
        }
        data = await dataСollection(setting, page, browser);
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
        return data;
    }
}
