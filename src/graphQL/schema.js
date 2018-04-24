const typeDefs = [`

  input UserInput {
    id: String
    name: String
    given_name: String 
    family_name: String     
    email: String
    verified_email: String
    picture: String
    hd: String
  }

  input PageInput {
    title: String
    url: String
    content: String
    sourceTags: [String] 
    authorId: String
  }
  
  input CommentInput {
    authorId: String
    pageId: String
    content: String
  }

  type Query {
    user(id: String): User
    page(_id: String): Page
    pages(data: [String]): [Page]
    comment(_id: String): Comment
  }
  
  type User {
    _id: String
    id: String
    name: String
    given_name: String 
    family_name: String 
    email: String
    verified_email: String
    picture: String
    hd: String
  }  

  type Page {
    _id: String
    title: String
    url: String
    content: String
    sourceTags: [String]
    comments: [Comment]
    authorId: String
    author: User
  }

  type Comment {
    _id: String
    pageId: String
    authorId: String
    content: String
    author: User
    page: Page
  }

  type Mutation { 
    createOrUpdateUser(input: UserInput): User
    createOrUpdatePage(input: PageInput): Page
    createComment(input: CommentInput): Comment
  }

  schema {
    query: Query
    mutation: Mutation
  }
`];

module.exports.typeDefs = typeDefs;