import {ObjectId} from 'mongodb';
import bodyParser from 'body-parser';
import validator from 'validator';

import {graphiqlExpress, graphqlExpress} from 'graphql-server-express/dist/index';
import {typeDefs} from './schema';
import {makeExecutableSchema} from 'graphql-tools/dist/index';
import config from '../config';
import {generateToken, isPasswordValid, saltHashPassword, getUserIdByToken} from '../utils/auth-utils';
import ValidationError from './validation-error';
import {prepareDbObject, updateTags} from '../utils/db-utils';

export function startGraphQL(app, db) {
  const Users = db.collection('users');
  const Pages = db.collection('pages');
  const Comments = db.collection('comments');
  const Tags = db.collection('tags');

  const resolvers = {
    Query: {
      user: async (root, {_id}) => {
        return prepareDbObject(await Users.findOne(ObjectId(_id)));
      },
      userByToken: async (root, {data}) => {
        const userId = getUserIdByToken(data);
        if (!userId) {
          throw new ValidationError([{ key: 'token', message: 'Invalid token.' }]);
        }
        return prepareDbObject(await Users.findOne(ObjectId(userId)));
      },
      getUserByGoogleId: async (root, {data}) => {
        return prepareDbObject(await Users.findOne({googleId: data}));
      },
      page: async (root, {data}) => {
        return prepareDbObject(await Pages.findOne(ObjectId(data)));
      },
      pages: async (root, {data}) => {
        return (await Pages.find({
          url: {
            $in: data
          }
        }).toArray()).map(prepareDbObject);
      },
      pageByUrl: async (root, {data}) => {
        return (await Pages.findOne({
          url: data
        }));
      },
      comment: async (root, {_id}) => {
        return prepareDbObject(await Comments.findOne(ObjectId(_id)));
      },
      getMyPages: async (root, {data}) => {
        return (await Pages.find({
          authorId: data
        }).toArray()).map(prepareDbObject);
      },
      getAllPages: async (root, {data}) => {
        return (await Pages.find().toArray()).map(prepareDbObject);
      },
      tags: async (root) => {
        return (await Tags.find().toArray()).map(prepareDbObject);
      },
    },
    Page: {
      comments: async ({_id}) => {
        let result = (await Comments.find({
          pageId: _id.toString()
        }).toArray()).map(prepareDbObject);

        console.log(result);
        return result;
      },
      author: async ({authorId}) => {
        return prepareDbObject(await Users.findOne(ObjectId(authorId)));
      }
    },
    Comment: {
      page: async ({pageId}) => {
        return prepareDbObject(await Pages.findOne(ObjectId(pageId)));
      },
      author: async ({authorId}) => {
        return prepareDbObject(await Users.findOne(ObjectId(authorId)));
      }
    },
    Tag: {
      pages: async ({pagesIds}) => {
        const ids = pagesIds.map(id => ObjectId(id));
        return await Pages.find({
          _id: {$in: ids }
        }).toArray().map(prepareDbObject);
      },
      count: ({pagesIds}) => {
        return pagesIds.length;
      }
    },
    Mutation: {
      // todo: return token
      registerGoogleUser: async (root, args) => {
        let user = prepareDbObject(await Users.findOne({email: args.input.email}));
        if (!user) {
          const result = await Users.insert(args.input);
          return prepareDbObject(await Users.findOne({_id: result.insertedIds[0]}));
        }
        throw new ValidationError([{ key: 'email', message: 'Can\'t found user.' }]);
      },
      updateUser: async (root, args) => {
        let user = prepareDbObject(await Users.findOne(ObjectId(args.input._id)));
        if (!user) {
          throw new ValidationError([{ key: '_id', message: 'Can\'t found user.' }]);
        }
        let {email, _id, ...userProps} = args.input;

        await Users.update({email: args.input.email}, {
          $set: userProps
        });

        return prepareDbObject(await Users.findOne({email: args.input.email}));
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

        let user = prepareDbObject(await Users.findOne({email: args.input.email, googleId: { $exists: false }}));
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
        const newUser = prepareDbObject(await Users.findOne({_id: result.insertedIds[0]}));

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

        let user = prepareDbObject(await Users.findOne({email: args.input.email, googleId: { $exists: false }}));
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
        let page = prepareDbObject(await Pages.findOne({url: args.input.url}))
        if (!page) {
          const result = await Pages.insert(args.input);
          const newPage = await prepareDbObject(await Pages.findOne({_id: result.insertedIds[0]}));
          await updateTags([], newPage.tags, newPage._id, db);
          return newPage ;
        }
        else {
          const {url, authorId, ...pageProps} = args.input;
          await Pages.update({url: page.url}, {
            $set: pageProps
          });
          const updatedPage = prepareDbObject(await Pages.findOne({url: args.input.url}));
          await updateTags(page.tags, updatedPage.tags, updatedPage._id, db);
          return updatedPage;
        }
      },
      createComment: async (root, args) => {
        const result = await Comments.insert(args.input);
        return prepareDbObject(await Comments.findOne({_id: result.insertedIds[0]}));
      }
    },
  };

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

