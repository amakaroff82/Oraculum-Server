import cors from 'cors';
import {graphiqlExpress, graphqlExpress} from 'graphql-server-express/dist/index';
import {typeDefs} from './schema';
import {makeExecutableSchema} from 'graphql-tools/dist/index';
import bodyParser from 'body-parser';
import {ObjectId} from 'mongodb';
import config from '../config';

const prepare = (o) => {
  if (o && o._id && typeof(o._id) === 'number') {
    o._id = o._id.toString();
  }
  return o;
}

export function startGraphQL(app, db) {
  const Users = db.collection('users');
  const Pages = db.collection('pages');
  const Comments = db.collection('comments');

  const resolvers = {
    Query: {
      user: async (root, {id}) => {
        return prepare(await Users.findOne({id}));
      },
      page: async (root, {_id}) => {
        return prepare(await Pages.findOne(ObjectId(_id)));
      },
      pages: async (root, {data}) => {
        return (await Pages.find({
          url: {
            $in: data
          }
        }).toArray()).map(prepare);
      },
      pageByUrl: async (root, {data}) => {
        return (await Pages.findOne({
          url: data
        }));
      },
      comment: async (root, {_id}) => {
        return prepare(await Comments.findOne(ObjectId(_id)));
      },
      getMyPages: async (root, {data}) => {
        return (await Pages.find({
          authorId: data
        }).toArray()).map(prepare);
      },
      getAllPages: async (root, {data}) => {
        return (await Pages.find().toArray()).map(prepare);
      },
      comment: async (root, {_id}) => {
        return prepare(await Comments.findOne(ObjectId(_id)));
      }
    },
    Page: {
      comments: async ({_id}) => {
        let result = (await Comments.find({
          pageId: _id.toString()
        }).toArray()).map(prepare);

        console.log(result);
        return result;
      },
      author: async ({authorId}) => {
        return prepare(await Users.findOne({id: authorId}));
      }
    },
    Comment: {
      page: async ({pageId}) => {
        return prepare(await Pages.findOne(ObjectId(pageId)));
      },
      author: async ({authorId}) => {
        return prepare(await Users.findOne({id: authorId}));
      }
    },
    Mutation: {
      createOrUpdateUser: async (root, args) => {
        let user = prepare(await Users.findOne({id: args.input.id}))
        if (!user) {
          const result = await Users.insert(args.input);
          return prepare(await Users.findOne({_id: result.insertedIds[0]}));
        }
        else {
          return user;
        }
      },
      createOrUpdatePage: async (root, args, context, info) => {
        let page = prepare(await Pages.findOne({url: args.input.url}))
        if (!page) {
          const result = await Pages.insert(args.input);
          return prepare(await Pages.findOne({_id: result.insertedIds[0]}));
        }
        else {
          let {url, authorId, ...pageProps} = args.input;

          await Pages.update({url: page.url}, {
            $set: pageProps
          });

          return prepare(await Pages.findOne({url: args.input.url}));
        }
      },
      createComment: async (root, args) => {
        const result = await Comments.insert(args.input);
        return prepare(await Comments.findOne({_id: result.insertedIds[0]}));
      }
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const apiPath = '/oraculum';
  const homePath = '/graphiql';

  // api url
  app.use(apiPath, bodyParser.json(), graphqlExpress({
    schema: schema
  }));

  // admin panel url
  app.use(homePath, graphiqlExpress({
    endpointURL: apiPath
  }));

  app.listen(config.app.port, () => {
    console.log(`Visit ${config.app.url}:${config.app.port}${homePath}`);
  })
}

