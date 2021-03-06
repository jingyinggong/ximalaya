const Crawler = require('crawler');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const book = require('./book.json');

const {BID, BOOKNAME, PAGE_END} = book;

const TEMPLATE_PAGE = `https://www.ximalaya.com/youshengshu/${BID}/pPID/`;

const PAGE_START = 1;


const REG_BID = /BID/;
const REG_PID = /PID/;

const DATA_PATH = `./data/${BID}/`;

const DATA = [];

const ERROR_DATA = [];

const JSON_FILE_NAME = `${DATA_PATH}list.json`;
const JSON_FILE_NAME_ERROR = `${DATA_PATH}list_error.json`;

const checkAndMakeDir = function(pathx) {
    if (!fs.existsSync(path.resolve(pathx))) {
        fs.mkdirSync(path.resolve(pathx));
    }
}

const writeJSON = function(filename, data) {
    checkAndMakeDir(DATA_PATH);
    data = _.orderBy(data, ['pid'], ['asc']);
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

const tidyName = function(str) {
  var d = str.match(/\d+/)[0];
  var x = '';
  switch(d.length) {
    case 1:
      x = '000' + d;
      break;
    case 2:
      x = '00' + d;
      break;
    case 3:
      x = '0' + d;
      break;
    default:
      x = d;
  }
  return str.replace(/\d+/, x);
}

const getPid = (str) => {
  var a = str.split('/');
  return a[a.length - 1];
}

const get_page_index = function(str) {
    return str.match(/\d+/)[1];
}

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
                  const $ = res.$;
                  const $a = $('#anchor_sound_list ._Vc .text a');
                  $a.each((index, item)=>{
                    DATA.push({
                      pid: getPid(item.attribs.href),
                      name: tidyName(item.attribs.title)
                    });
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

const Q = getAQueue(PAGE_START, PAGE_END, TEMPLATE_PAGE, REG_PID);

initCrawler(Q);

