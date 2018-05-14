import {MongoClient} from 'mongodb'
import {getPageContent} from "../web-parser/index";
import config from '../config';

let Pages,
  isStarted = false;

module.exports = {
  timeout: 5000,
  start: () => {
    MongoClient.connect(config.db.mongoUrl, (err, db)=> {
      if(err){
        console.log("MongoDB error: ", err);
        return;
      }

      Pages = db.collection('pages');
      isStarted = true;
      module.exports.process();
    });
  },
  stop: () => {
    isStarted = false;
  },
  process: async () => {
    if (isStarted) {
      const page = await Pages.findOne({
        parsedContent: { $exists: false }
      });

      if (page) {
        const parsedContent = await getPageContent(page.url);

        await Pages.update({url: page.url}, {
          $set: {
            parsedContent: parsedContent,
          }
        });
        setTimeout(module.exports.process, module.exports.timeout);
      }
    }
  }
};