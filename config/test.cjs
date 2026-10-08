module.exports = {
  port: 1337,
  dbUri: "mongodb://localhost:27017/TS-REST-API",
  saltWorkFactor: 10,
  accessTokenTtl: "15m",
  refreshTokenTtl: "1y",
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_KEY,
};
