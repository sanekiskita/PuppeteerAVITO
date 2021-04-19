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
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const setting = require("./settings");
const authorization_1 = require("./authorization");
const data_ollection_1 = require("./data\u0421ollection");
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
function startPuppeteer() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = [];
        puppeteer.use(StealthPlugin({}));
        const browser = yield puppeteer.launch(setting.browser);
        const page = yield browser.newPage();
        yield page.setBypassCSP(true);
        let sessid;
        try {
            yield page.goto(setting.link, {
                waitUntil: 'load',
                timeout: 0,
            });
            if (setting.passAuthorization) {
                if (!!setting.password.length || !!setting.login.length) {
                    sessid = yield authorization_1.default(page, setting.login, setting.password);
                }
                else
                    throw new Error("Логин или пароль отсутствуют");
            }
            data = yield data_ollection_1.default(setting, page, puppeteer, sessid);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            yield browser.close();
        }
        return data;
    });
}
exports.default = startPuppeteer;
