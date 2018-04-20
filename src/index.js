import 'babel-core/register'
import 'babel-polyfill'
import {start} from './graphQLMongo'
import {startSockets} from './wsserver'
import cors from "cors";
import express from "express";


const app = express();
app.use(cors()); // FOR DEVELOPMENT ONLY!


start(app);
//startSockets();