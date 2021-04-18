//import randomInteger from './randomInteger'

/**
 * авторизация на сайте.
 *
 * @param  login логин.
 * @param  password пароль.
 * @return sessid - id подключения 
 */
export default async function authorization (page , login: string , password: string ) {
    let sessid:String;
    let aut:boolean = false;
    try{

    await page.click("a[data-marker='header/login-button']");

     await page.focus('input[name=login]');
      await page.keyboard.type(login, { delay: 10 });

      await page.keyboard.press('Tab');
      await page.keyboard.type(password, { delay: 10 });

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');

      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      do {
        await page.waitForTimeout(1000);
        const cookies = await page.cookies(
          "https://www.avito.ru"
        );
        
        if (
          cookies.filter((item: { name: string; value: string; }) => item.name == "auth" && item.value == "1")
            .length && cookies.filter((item: { name: string; value: string; }) => item.name == "sessid")
            .length
        ){
          aut = true;
          sessid=cookies.filter((item: { name: string; value: string; }) => item.name == "sessid")[0].value;
          console.log("sessid:"+sessid);
          }else{
            console.log("авторизация не прошла!!!");
          }

      } while (!aut);   
      console.log("авторизация прошла");
      return sessid;
    }catch(e){
        throw new Error("ошибка в авторизации");
    }
}