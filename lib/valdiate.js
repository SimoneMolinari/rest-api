const puppeteer = require('puppeteer');

module.exports = {
    
    validate : async (asin) => {
    
        let s = 'https://amazon.it/dp/';
        const url = s + asin;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
        
        const [el] = await page.$x('html/head/title');
        const txt = await el.getProperty('textContent');
        const rawTxt = await txt.jsonValue();

        if (await (rawTxt != '404 - Documento non trovato')) {
            // console.log(rawTxt);
            // console.log('true');
            browser.close();
            return true;
        } else {
            // console.log('false');
            // console.log(rawTxt);
            browser.close();
            return false;
        }
    }

}