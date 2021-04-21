// tslint:disable-next-line:one-variable-per-declaration
export
const link =
"https://www.avito.ru/sankt-peterburg/koshki/poroda-meyn-kun-ASgBAgICAUSoA5IV?p=",
login = "",
password = "",
passAuthorization = false,
browser = {
    headless: false,
    args: ["--window-size=1280,1024","--shm-size=1gb",
        // '--proxy-server=176.193.32.111:8080',
        //'--proxy-server=socks5://46.0.205.175:1080',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list '
        ]
};
export const maxContent = 1; // 0 - это все страницы

