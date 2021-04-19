"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Tesseract = require("tesseract.js");
function recognize(file, lang) {
    return Tesseract.recognize(file, lang).then(({ data: { text } }) => {
        return text;
    });
}
function setResult(text) {
    text = text.replace(/\r?\n|\r/g, "");
    return text;
}
function default_1(imgScr) {
    if (!imgScr)
        return "нет картинки";
    return recognize(imgScr, "rus").then(setResult);
}
exports.default = default_1;
