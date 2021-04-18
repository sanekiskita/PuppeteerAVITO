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
function authorization(page, login, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let sessid;
        let aut = false;
        try {
            yield page.click("a[data-marker='header/login-button']");
            yield page.focus('input[name=login]');
            yield page.keyboard.type(login, { delay: 10 });
            yield page.keyboard.press('Tab');
            yield page.keyboard.type(password, { delay: 10 });
            yield page.keyboard.press('Tab');
            yield page.keyboard.press('Tab');
            yield page.keyboard.press('Space');
            yield page.keyboard.press('Tab');
            yield page.keyboard.press('Enter');
            do {
                yield page.waitForTimeout(1000);
                const cookies = yield page.cookies("https://www.avito.ru");
                if (cookies.filter((item) => item.name == "auth" && item.value == "1")
                    .length && cookies.filter((item) => item.name == "sessid")
                    .length) {
                    aut = true;
                    sessid = cookies.filter((item) => item.name == "sessid")[0].value;
                    console.log("sessid:" + sessid);
                }
                else {
                    console.log("авторизация не прошла!!!");
                }
            } while (!aut);
            console.log("авторизация прошла");
            return sessid;
        }
        catch (e) {
            throw new Error("ошибка в авторизации");
        }
    });
}
exports.default = authorization;
