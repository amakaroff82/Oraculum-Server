import {MongoClient, ObjectId} from 'mongodb'
import {startGraphQL} from './graphQL'
//import {startSockets} from './wsserver'

const MONGO_URL = 'mongodb://oraculum:oraculum@ds231549.mlab.com:31549/oraculum'

export const start = (app) => {
  try {
    MongoClient.connect(MONGO_URL, (err, db)=>{
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
