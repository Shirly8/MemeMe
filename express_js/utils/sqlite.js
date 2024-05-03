const sqlite3 = require('sqlite3').verbose();

//CONNECT TO THE DATABASE AND DATABASE FILE
function connectToDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('mydatabase.db', (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to the database SQLite');
        resolve(db);
      }
    });
  });
}
module.exports = connectToDatabase;
