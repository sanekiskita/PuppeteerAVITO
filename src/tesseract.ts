const Tesseract = require("tesseract.js");

// Распознавание изображения
function recognize(file, lang, logger) {
  return Tesseract.recognize(file, lang, { logger }).then(
    ({ data: { text } }) => {
      return text;
    }
  );
}

// Отслеживание прогресса обработки
function updateProgress(data) {}

// Вывод результата
function setResult(text:string):string {
  text = text.replace(/\r?\n|\r/g, "");
  return text;
}

export default function (imgScr:string):string {
  if (!imgScr) return "нет картинки";

  return recognize(imgScr, "rus", updateProgress).then(setResult);
};