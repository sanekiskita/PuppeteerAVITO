/**
 *
 * @param дата с сайта.
 * @return дату в формате ISO-8601.
 */
export default function (strdate) {
    const arrdate = strdate.split(' ');
    arrdate.push(arrdate.pop().split(':'));
    const index = arrdate.indexOf('в');
    if (index > -1) arrdate.splice(index, 1);

    const datenow = new Date();

    switch (arrdate[0]) {
        case 'Сегодня':
            datenow.setHours(arrdate[1][0]);
            datenow.setMinutes(arrdate[1][1]);
            break;
        case 'Вчера':
            datenow.setDate(datenow.getDate() - 1);
            datenow.setHours(arrdate[1][0]);
            datenow.setMinutes(arrdate[1][1]);
            break;
        default:
            datenow.setDate(arrdate[0]);
            datenow.setMonth(getMonthFromString(arrdate[1].substr(0, 3)));
            datenow.setHours(arrdate[2][0]);
            datenow.setMinutes(arrdate[2][1]);
    }
    const date = new Date(
        datenow.getFullYear(),
        datenow.getMonth(),
        datenow.getDate(),
        datenow.getHours(),
        datenow.getMinutes(),
        0,
        0
    );
    return date.toISOString();
}

function getMonthFromString(month1: string): number {
    const months = [
        'янв',
        'фев',
        'мар',
        'апр',
        'май',
        'июн',
        'июл',
        'авг',
        'сен',
        'окт',
        'ноя',
        'дек',
    ];
    return months.indexOf(month1);
}
