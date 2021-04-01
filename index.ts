import puppeteer from './src/puppeteer'

puppeteer().then((value) => {
    console.log(JSON.stringify(value));
  });