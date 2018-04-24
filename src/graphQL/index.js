import cors from 'cors';
import {graphiqlExpress, graphqlExpress} from 'graphql-server-express/dist/index';
import {typeDefs} from './schema';
import {makeExecutableSchema} from 'graphql-tools/dist/index';
import bodyParser from 'body-parser';
import {ObjectId} from 'mongodb'

const URL = 'http://localhost'
const PORT = 8080

const prepare = (o) => {
    if(o && o._id && typeof(o._id) === 'number') {
        o._id = o._id.toString();
    }
    return o;
}

function startGraphQL(app, db){
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
                    url:{
                        $in: data
                    }
                }).toArray()).map(prepare);
            },
            comment: async (root, {_id}) => {
                return prepare(await Comments.findOne(ObjectId(_id)));
            }
        },
        Page: {
            comments: async ({_id}) => {
                return (await Comments.find({pageId: _id}).toArray()).map(prepare);
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
                if(!user) {
                    const res = await Users.insert(args.input);
                    console.log(res);
                    return prepare(await Users.findOne({_id: res.insertedIds[0]}));
                }
                else{
                    return user;
                }
            },
            createOrUpdatePage: async (root, args, context, info) => {
                let page = prepare(await Pages.findOne({url: args.input.url}))
                if(!page) {
                    const res = await Pages.insert(args.input);
                    console.log(res);
                    return prepare(await Pages.findOne({_id: res.insertedIds[0]}));
                }
                else{
                    const res = await Pages.update({_id: page._id}, {
                        sourceTags: args.input.sourceTags,
                        content: args.input.content
                    });
                    return prepare(await Pages.findOne({url: args.input.url}));
                }
            },
            createComment: async (root, args) => {
                const res = await Comments.insert(args.input);
                return prepare(await Comments.findOne({_id: res.insertedIds[0]}));
            }
        },
    }

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers
    });

    app.use('/oraculum', bodyParser.json(), graphqlExpress({schema}));

    const homePath = '/graphiql';

    app.use(homePath, graphiqlExpress({
        endpointURL: '/oraculum'
    }))

    app.listen(PORT, () => {
        console.log(`Visit ${URL}:${PORT}${homePath}`);
    })
}

module.exports.startGraphQL = startGraphQL;