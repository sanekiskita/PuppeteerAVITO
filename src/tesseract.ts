const Tesseract = require("tesseract.js");

// Распознавание изображения
function recognize(file, lang) {
  return Tesseract.recognize(file, lang).then(
    ({ data: { text } }) => {
      return text;
    }
  );
}

// Вывод результата
function setResult(text:string):string {
  text = text.replace(/\r?\n|\r/g, "");
  return text;
}

/**
 * Возвращает данные с картинки (текст русский)
 *
 * @param  imgScr ссылка на картинку
 * @return  текст с картинки.
 */
export default function (imgScr:string):string {
  if (!imgScr) return "нет картинки";

  return recognize(imgScr, "rus").then(setResult);
}