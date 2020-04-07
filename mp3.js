const Crawler = require('crawler');
const path = require('path');
const fs = require('fs');

const book = require('./book.json');

const {BID, BOOKNAME, PAGE_END} = book;

const DATA_PATH = `./data/${BID}/`;

const DATA = [];

const ERROR_DATA = [];

const JSON_FILE_NAME_MP3 = `${DATA_PATH}list-mp3.json`;

const JSON_FILE_NAME_ERROR = `${DATA_PATH}list_error.json`;

const metaData = require(JSON_FILE_NAME_MP3);

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
  return data.map((item, index)=>{
    return {
      uri: item.src,
      name: item.name
    }
  });
}

const getPid = (str) => {
  var a = str.split('/');
  return a[a.length - 1];
}

const get_page_index = function(str) {
    console.log('--------str', str);
    return str.match(/id=(\d+)/)[0];
}

const updateMetaData = function(data = metaData, pid, src) {
  for(let i = 0; i < data.length; i++) {
    if(data[i].pid === pid) {
      data[i].src = src;
      break;
    }
  }
}

const get_suffix = function(src) {
  var a = src.split('.');
  return a[a.length - 1];
}

const initCrawler = function(queue) {
    var c = new Crawler({
        maxConnections : 5,
        jQuery: false,
        callback: function (error, res, done) {
            let uri = res.options.uri;
            console.log(`uri: ${uri}`)
            if(error) {
                console.log(error);
                ERROR_DATA.push(res.options);
            } else {
                try {
                  var filename = path.resolve(DATA_PATH, res.options.name + '.' + get_suffix(uri));
                  fs.createWriteStream(filename).write(res.body);
                  console.log('mp3 file saved = ' + filename);
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
        console.log('all crawler done');
        writeJSON(JSON_FILE_NAME_ERROR, ERROR_DATA);
    });

    return c;
}

const Q = getAQueue(metaData);

initCrawler(Q);

