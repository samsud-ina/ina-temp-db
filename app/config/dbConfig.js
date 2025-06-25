const env = require('./env.js');
const fs = require('fs');
const mySql = require('mysql2');

const pool = mySql.createConnection({
  host: env.host,
  port: env.port,
  user: env.username,
  password: env.password,
  database: env.database,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '..', 'ca.pem'))
  }
});

module.exports = {
  pool,
}
