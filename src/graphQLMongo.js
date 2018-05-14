import {MongoClient, ObjectId} from 'mongodb';
import {startGraphQL} from './graphQL';
import config from './config';
//import {startSockets} from './wsserver'

export const start = (app) => {
  try {
    MongoClient.connect(config.db.mongoUrl, (err, db)=>{
      if(err){
        console.log("MongoDB error: ", err);
        return;
      }

      startGraphQL(app, db);
    });
  } catch (e) {
    console.log('Error: ', e);
  }
}
