"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("./src/puppeteer");
puppeteer_1.default().then((value) => {
    console.log(JSON.stringify(value));
});
