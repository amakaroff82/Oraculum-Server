const typeDefs = [`

  input UserInput {
    googleId: String
    name: String
    given_name: String 
    family_name: String     
    email: String
    verified_email: String
    picture: String
    hd: String
  }
  
  input UpdateUserInput {
    _id: String
    name: String
    email: String
  }
  
  input RegistrationInput {
    name: String!
    email: String!
    password: String!
  }
  
  input LoginInput {
    email: String!
    password: String!
  }

  input PageInput {
    title: String
    url: String
    content: String
    sourceTags: [String] 
    tags: [String]
    selection: String
    authorId: String
  }
  
  input CommentInput {
    authorId: String
    pageId: String
    content: String
  }

  type Query {
    user(_id: String): User
    getUserByGoogleId(data: String): User
    page(_id: String): Page
    pageByUrl(data: String): Page
    pages(data: [String]): [Page]
    getMyPages(data: String): [Page]
    getAllPages: [Page]
    comment(_id: String): Comment
  }
  
  type User {
    _id: String
    googleId: String
    name: String
    given_name: String 
    family_name: String 
    email: String
    verified_email: String
    picture: String
    hd: String
    passwordHash: String
    salt: String
  }  

  type Page {
    _id: String
    title: String
    url: String
    content: String
    parsedContent: String
    tags: [String]
    selection: String
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
  
  type AuthData {
    _id: String
    token: String
    user: User
  }

  type Mutation {
    registerGoogleUser(input: UserInput): User
    updateUser(input: UpdateUserInput): User
    registerUser(input: RegistrationInput): AuthData
    loginUser(input: LoginInput): AuthData
    createOrUpdatePage(input: PageInput): Page
    createComment(input: CommentInput): Comment
  }

  schema {
    query: Query
    mutation: Mutation
  }
`];

module.exports.typeDefs = typeDefs;