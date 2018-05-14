const env = process.env.NODE_ENV;

const development = {
  app: {
    port: 8080,
    url: 'http://localhost'
  },
  db: {
    mongoUrl: 'mongodb://oraculum:oraculum@ds231549.mlab.com:31549/oraculum'
  },
  webParser: {
    mercuryApiKey: 'l9LlnJvWfcSa22lNPUk0Deq1IbBwvBOqu4wujJBT'
  }
};

const production = {
  app: {
    port: 8080,
    url: 'https://oraculum-dev.tk'
  },
  db: {
    mongoUrl: 'mongodb://oraculum:oraculum@ds231549.mlab.com:31549/oraculum'
  },
  webParser: {
    mercuryApiKey: 'l9LlnJvWfcSa22lNPUk0Deq1IbBwvBOqu4wujJBT'
  }
};

module.exports = env === 'development' ? development : production;