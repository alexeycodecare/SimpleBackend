require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const dbConfig = {
  host: process.env.DATABASE_URL,
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
          userName VARCHAR(255) NOT NULL UNIQUE,
          score INT NOT NULL DEFAULT 0
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

// Processing queries to retrieve data from a table (only first 10 records sorted by score descending)
app.get('/users', (req, res) => {
  const selectQuery = 'SELECT * FROM users ORDER BY score DESC LIMIT 10';
  connection.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Request execution error:', err);
      res.status(500).json({ error: 'Request execution error' });
      return;
    }
    res.json(results);
  });
});

app.post('/users', (req, res) => {
  const { userName, score } = req.body;

  console.log("From server", userName, score)
  if (!userName || isNaN(score)) {
    res.status(400).json({ error: 'User data invalid' });
    return;
  }

  // Check if a user with a given name exists
  connection.query('SELECT * FROM users WHERE userName = ?', [userName], (err, results) => {
    if (err) {
      console.error('Request execution error:', err);
      res.status(500).json({ error: 'Request execution error' });
      return;
    }

    if (results.length === 0) {
      // If there is no user with the same name, perform the INSERT operation
      connection.query('INSERT INTO users (userName, score) VALUES (?, ?)', [userName, score], (err, results) => {
        if (err) {
          console.error('Request execution error:', err);
          res.status(500).json({ error: 'Request execution error' });
          return;
        }
        res.json(results);
      });
    } else {
      // If a user with the same name already exists, perform the UPDATE operation
      connection.query('UPDATE users SET score = ? WHERE userName = ?', [score, userName], (err, results) => {
        if (err) {
          console.error('Request execution error:', err);
          res.status(500).json({ error: 'Request execution error' });
          return;
        }
        res.json(results);
      });
    }
  });
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The server is running on the port ${PORT}`);
});
