require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');

const app = express();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const connection = mysql.createConnection(dbConfig);

// Connecting to MySQL server
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL server:', err);
    return;
  }
  console.log('Successful connection to MySQL server');

  // Creating a database if it doesn't exist
  connection.query('CREATE DATABASE IF NOT EXISTS webGL_db', (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    console.log('The database was successfully created or already exists');

    // Switch to the created database
    connection.query('USE webGL_db', (err) => {
      if (err) {
        console.error('Database selection error:', err);
        return;
      }
      console.log('Database selected');

      // Creating a table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userName VARCHAR(255) NOT NULL,
          score VARCHAR(255) NOT NULL,
        )
      `;
      connection.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          return;
        }
        console.log('The table was successfully created or already exists');
      });
    });
  });
});

// Error processing
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Processing queries to retrieve data from a table
app.get('/users', (req, res) => {
  const selectQuery = 'SELECT * FROM users';
  connection.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Request execution error:', err);
      res.status(500).json({ error: 'Request execution error' });
      return;
    }
    res.json(results);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The server is running on the port ${PORT}`);
});
