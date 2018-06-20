import {MongoClient} from 'mongodb';
import config from '../config';

let Pages,
  Tags,
  isStarted = false;

module.exports = {
  timeout: 10000,
  start: () => {
    MongoClient.connect(config.db.mongoUrl, (err, db)=> {
      if(err){
        console.log("MongoDB error: ", err);
        return;
      }

      Pages = db.collection('pages');
      Tags = db.collection('tags');
      isStarted = true;
      module.exports.process();
    });
  },
  stop: () => {
    isStarted = false;
  },
  process: async () => {
    if (isStarted) {
      const pages = await Pages.find({
        tags: { $exists: true }
      }).toArray();
      const tagsData = {};
      const tags = [];
      await Tags.remove();

      for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        for (let j = 0; j < page.tags.length; j++) {
          let tag = page.tags[j];
          tagsData[tag] = tagsData[tag] ? tagsData[tag] + 1 : 1;
        }
      }

      Object.keys(tagsData).map(function(key, index) {
        tags.push({
          text: key,
          count: tagsData[key]
        })
      });
      if (tags.length) {
        await Tags.insert(tags);
      }
      setTimeout(module.exports.process, module.exports.timeout);
    }
  }
};
