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

type ArrayAdvert = Advert[]
/**
 * Возвращает массив с данными.
 *
 * @return {array} данные с сайта.
 */
export default async function startPuppeteer() {
    let data: ArrayAdvert = [];
    puppeteer.use(StealthPlugin({}));
    const browser = await puppeteer.launch(setting.browser);
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    let sessid;
    try {
        await page.goto(setting.link, {
            waitUntil: 'load',
            timeout: 0,
        });
        if(setting.passAuthorization){
        if (!!setting.password.length||!!setting.login.length) {
             sessid = await authorization(page, setting.login, setting.password);
        }
        else throw new Error("Логин или пароль отсутствуют");
        }
        data = await dataСollection(setting, page, puppeteer, sessid);
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
    }
    return data;
}
