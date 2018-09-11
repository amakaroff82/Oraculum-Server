const env = process.env.NODE_ENV;

const development = {
  app: {
    port: 7070,
    url: 'http://127.0.0.1'
  },
  db: {
    mongoUrl: 'mongodb://localhost:27017/oraculum'
  },
  webParser: {
    mercuryApiKey: 'l9LlnJvWfcSa22lNPUk0Deq1IbBwvBOqu4wujJBT'
  }
};

const production = {
  app: {
    port: 7070,
    url: 'http://127.0.0.1'
  },
  db: {
    mongoUrl: 'mongodb://localhost:27017/oraculum'
  },
  webParser: {
    mercuryApiKey: 'l9LlnJvWfcSa22lNPUk0Deq1IbBwvBOqu4wujJBT'
  }
};

module.exports = env === 'development' ? development : production;