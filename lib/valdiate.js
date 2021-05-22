//const puppeteer = require('puppeteer');
//var casper = require('casper').create();
//var Spooky = require('spooky');
//const request = require('request');

module.exports = {
    
	/*
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
            console.log('true');
            browser.close();
            return true;
        } else {
            console.log('false');
            // console.log(rawTxt);
            browser.close();
            return false;
        }
    }
	validate : async (asin) =>  {
        url = 'https://amazon.it/dp/' + asin;
        var title;
        casper.start(url);

        casper.then(function() {
            if(this.getTitle() == '404 - Documento non trovato') {
                title = true;
            } else {
                title = false;
            }
        });

        casper.run();
        return title;
    }

validate: async (asin) => {
        url = 'https://amazon.it/dp/' + asin;
        var spooky = new Spooky({
            child: {
                transport: 'http'
            },
            casper: {
                logLevel: 'debug',
                verbose: true
            }
        }, function (err) {
            if (err) {
                e = new Error('Failed to initialize SpookyJS');
                e.details = err;
                throw e;
            }

            spooky.start(url);

            spooky.then(function () {
                if (this.getTitle() == '404 - Documento non trovato') {
                    title = true;
                } else {
                    title = false;
                }
            });

            spooky.run();
            return title;
        });

    }

	validate: async (asin) => {
	        let title;
	        let url = 'https://amazon.it/dp/' + asin;
	        request(url, { json: true }, (err, res, body) => {
	            if (err) {
	                return console.log(err);
	            }

	            title = body.title;
	            console.log(body.title);
	        });

	        if (title == '404 - Documento non trovato') {
	            return true;
	        } else {
	            return false;
	        }
	    }*/
}

