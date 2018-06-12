import {ObjectId} from 'mongodb';
import bodyParser from 'body-parser';
import validator from 'validator';

import {graphiqlExpress, graphqlExpress} from 'graphql-server-express/dist/index';
import {typeDefs} from './schema';
import {makeExecutableSchema} from 'graphql-tools/dist/index';
import config from '../config';
import {generateToken, isPasswordValid, saltHashPassword} from '../auth-utils';
import ValidationError from './validation-error';

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
      user: async (root, {_id}) => {
        return prepare(await Users.findOne(ObjectId(_id)));
      },
      getUserByGoogleId: async (root, {data}) => {
        return prepare(await Users.findOne({googleId: data}));
      },
      page: async (root, {data}) => {
        return prepare(await Pages.findOne(ObjectId(data)));
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
        return prepare(await Users.findOne(ObjectId(authorId)));
      }
    },
    Comment: {
      page: async ({pageId}) => {
        return prepare(await Pages.findOne(ObjectId(pageId)));
      },
      author: async ({authorId}) => {
        return prepare(await Users.findOne(ObjectId(authorId)));
      }
    },
    Mutation: {
      // todo: return token
      registerGoogleUser: async (root, args) => {
        let user = prepare(await Users.findOne({email: args.input.email}));
        if (!user) {
          const result = await Users.insert(args.input);
          return prepare(await Users.findOne({_id: result.insertedIds[0]}));
        }
        throw new ValidationError([{ key: 'email', message: 'Can\'t found user.' }]);
      },
      updateUser: async (root, args) => {
        let user = prepare(await Users.findOne(ObjectId(args.input._id)));
        if (!user) {
          throw new ValidationError([{ key: '_id', message: 'Can\'t found user.' }]);
        }
        let {email, _id, ...userProps} = args.input;

        await Users.update({email: args.input.email}, {
          $set: userProps
        });

        return prepare(await Users.findOne({email: args.input.email}));
      },
      registerUser: async (root, args) => {

        let errors = [];

        if (validator.isEmpty(args.input.name)) {
          errors.push({ key: 'name', message: 'The name must not be empty.' });
        }

        if (validator.isEmpty(args.input.email)) {
          errors.push({ key: 'email', message: 'The email address must not be empty.' });
        }

        if (validator.isEmpty(args.input.password)) {
          errors.push({ key: 'password', message: 'The password filed must not be empty.' });
        } else if (!validator.isLength(args.input.password, { min: 6 })) {
          errors.push({ key: 'password', message: 'The password must be at a minimum 6 characters long.' });
        }

        let user = prepare(await Users.findOne({email: args.input.email}));
        if (user) {
          errors.push({ key: 'email', message: 'A user with this email address already exists.' });
        }

        if (errors.length) throw new ValidationError(errors);

        let {salt, passwordHash} = saltHashPassword(args.input.password);

        const result = await Users.insert({
          email: args.input.email,
          name: args.input.name,
          salt: salt,
          passwordHash: passwordHash
        });
        const token = generateToken(result.insertedIds[0]);
        const newUser = prepare(await Users.findOne({_id: result.insertedIds[0]}));

        return {
          token: token,
          user: newUser
        };
      },
      loginUser: async (root, args) => {

        let errors = [];

        if (validator.isEmpty(args.input.email)) {
          errors.push({ key: 'email', message: 'The email address must not be empty.' });
        }

        if (validator.isEmpty(args.input.password)) {
          errors.push({ key: 'password', message: 'The password filed must not be empty.' });
        }

        if (errors.length) throw new ValidationError(errors);

        let user = prepare(await Users.findOne({email: args.input.email}));
        if (!user) {
          errors.push({ key: 'email', message: 'A user with this email address is absent.' });
          throw new ValidationError(errors);
        }

        if (!isPasswordValid(args.input.password, user.salt, user.passwordHash)) {
          errors.push({ key: 'password', message: 'Invalid password' });
          throw new ValidationError(errors);
        }

        const token = generateToken(user._id);

        return {
          token: token,
          user: user
        };
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
    schema: schema,
    formatError: error => ({
      message: error.message,
      state: error.originalError && error.originalError.state,
      locations: error.locations,
      path: error.path,
    })
  }));

  // admin panel url
  app.use(homePath, graphiqlExpress({
    endpointURL: apiPath
  }));

  app.listen(config.app.port, () => {
    console.log(`Visit ${config.app.url}:${config.app.port}${homePath}`);
  })
}

