const Crawler = require('crawler');
const path = require('path');
const fs = require('fs');

const BID = "34818749";
const BOOKNAME = "jipinyuyi";

const TEMPLATE_PAGE = 'https://www.ximalaya.com/youshengshu/BID/pPID/';

const PAGE_START = 1;

const PAGE_END = 41;

const REG_BID = /BID/;
const REG_PID = /PID/;

const DATA_PATH = './data/BID/';

const DATA = [];

const ERROR_DATA = [];

const JSON_FILE_NAME = `${DATA_PATH}list.json`;
const JSON_FILE_NAME_ERROR = `${DATA_PATH}list_error.json`;

const checkAndMakeDir = function(path) {
    if (!fs.existsSync(fs.resolve(path))) {
        fs.mkdir(fs.resolve(path));
    }
}

const writeJSON = function(filename, data) {
    fs.writeFile(path.resolve(filename), JSON.stringify(data), function(){
        console.log(`${filename} saved!`);
    });
}

const getAQueue = function(start, end, template, reg) {
    let arr = [];
    for(let i = start; i < end; i++) {
        arr.push(template.replace(reg, i));
    }
    return arr;
}

const JIEMA = function(u) {
	var tArr = u.split("*");
	var str = '';
	for(var i = 1, n = tArr.length; i< n; i++){
		str += String.fromCharCode(tArr[i]);
	}
	return str;
}

const get_page_index = function(str) {
    return str.match(/(\d+)\.html/)[1];
}

const REG_MA = /datas=\(FonHen_JieMa\(\'(.*)\'\)\.split/;

const initCrawler = function(queue) {
    var c = new Crawler({
        maxConnections : 10,
        callback : function (error, res, done) {
            let index = get_page_index(res.options.uri);
            console.log(`shit == ${index}`)
            if(error) {
                console.log(error);
                ERROR_DATA.push(index);
            } else {
                try {
                    let x = res.body.match(REG_MA);
                    let str = x[1];
                    let u = JIEMA(str).split('&')[0];
                    DATA.push({
                        i: index,
                        u: u
                    });
                } catch(e) {
                    console.log('catchx ', e);
                    ERROR_DATA.push(index);
                }
            }
            done();
        }
    });

    c.queue(queue);

    c.on('drain',function(){
        console.log('crawler done');
        writeJSON(JSON_FILE_NAME, DATA);
        writeJSON(JSON_FILE_NAME_ERROR, ERROR_DATA);
    });

    return c;
}

const Q = getAQueue(PAGE_START, PAGE_END, TEMPLATE_PAGE, REPLACE_REG);

initCrawler(Q);

