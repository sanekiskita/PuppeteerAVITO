//import randomInteger from './randomInteger'

/**
 * авторизация на сайте.
 *
 * @param  login логин.
 * @param  password пароль.
 * @return  void
 */
export default async function authorization (page , login: string , password: string ) {
    try{

    await page.click("a[data-marker='header/login-button']");

     await page.focus('input[name=login]');
      await page.keyboard.type(login, { delay: 100 });

      await page.keyboard.press('Tab');
      await page.keyboard.type(password, { delay: 100 });

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');

      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      //Проверка авторизации
      let aut:boolean = false;
      do {
        await page.waitForTimeout(10000);
        const cookiesSet = await page.cookies(
          "https://www.avito.ru"
        );
        if (
          cookiesSet.filter((item: { name: string; value: string; }) => item.name == "auth" && item.value == "1")
            .length
        )
          aut = true;

        if (!aut) console.log("авторизация не прошла!!!");
      } while (!aut);
      console.log("авторизация прошла");
    }catch(e){
        throw new Error("ошибка в авторизации");
    }
}