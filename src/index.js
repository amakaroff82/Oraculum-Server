import 'babel-core/register'
import 'babel-polyfill'
import {start} from './graphQLMongo'
import {startSockets} from './wsserver'
import cors from "cors";
import express from "express";

const app = express();

if(process.env.NODE_ENV === 'development' ){
  // FOR DEVELOPMENT ONLY!
  console.log("\x1b[31m", "Warning: Development mode - CORS disabled!")
  console.log("\x1b[0m");

  app.use(cors());
}

start(app);
//startSockets();