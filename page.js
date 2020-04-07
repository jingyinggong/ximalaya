const Crawler = require('crawler');
const path = require('path');
const fs = require('fs');

const book = require('./book.json');

const {BID, BOOKNAME, PAGE_END} = book;

const TEMPLATE_PAGE = `https://www.ximalaya.com/revision/play/v1/audio?id=PID&ptype=1`;

const PAGE_START = 1;

const REG_BID = /BID/;
const REG_PID = /PID/;

const DATA_PATH = `./data/${BID}/`;

const DATA = [];

const ERROR_DATA = [];

const JSON_FILE_NAME = `${DATA_PATH}list.json`;
const JSON_FILE_NAME_MP3 = `${DATA_PATH}list-mp3.json`;
const JSON_FILE_NAME_ERROR = `${DATA_PATH}list_error.json`;

const metaData = require(JSON_FILE_NAME);

const checkAndMakeDir = function(pathx) {
    if (!fs.existsSync(path.resolve(pathx))) {
        fs.mkdirSync(path.resolve(pathx));
    }
}

const writeJSON = function(filename, data) {
  if(data && data.length) {
    fs.writeFile(path.resolve(filename), JSON.stringify(data), function(){
        console.log(`${filename} saved!`);
    });
  } else {
    console.log('no data need to be saved!');
  }
}

const getAQueue = function(data, template, reg) {
  console.log(data)
  return data.map((item, index)=>{
    return {
      uri: template.replace(reg, item.pid),
      name: item.name
    }
  });
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
    return str.match(/id=(\d+)/)[1];
}

const updateMetaData = function(data = metaData, pid, src) {
  for(let i = 0; i < data.length; i++) {
    if(data[i].pid === pid) {
      data[i].src = src;
      break;
    }
  }

}

const initCrawler = function(queue) {
    var c = new Crawler({
        maxConnections : 20,
        jQuery: false,
        callback: function (error, res, done) {
            let index = get_page_index(res.options.uri);
            console.log(`uri: ${res.options.uri} and index: ${index}`)
            if(error) {
                console.log(error);
                ERROR_DATA.push(index);
            } else {
                try {
                  var music = JSON.parse(res.body);
                  updateMetaData(metaData, index, music.data.src);
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
        writeJSON(JSON_FILE_NAME_MP3, metaData);
        writeJSON(JSON_FILE_NAME_ERROR, ERROR_DATA);
    });

    return c;
}

const Q = getAQueue(metaData, TEMPLATE_PAGE, REG_PID);

initCrawler(Q);

