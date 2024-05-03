
//ALL IMPORTS
const express = require('express');
const connectToDatabase = require('./utils/sqlite');
const crypto = require('crypto');
const https = require('https');
const GIPHY_API_KEY = 'HibNcQLFjKE0yo5npvy2UZnyu8KFpyrp';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(__dirname + '/public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

//GIFPY API
app.get('/search-gifs', (req, res) => {
  const searchTerm = req.query.term;
  const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchTerm}&limit=100`;

  https.get(giphyUrl, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData.data);
      } catch (error) {
        console.error(`Error JSON: ${error.message}`);
        res.status(500).json({ error: 'Error with JSON' });
      }
    });
  }).on('error', (error) => {
    res.status(500).json({ error: 'An error occurred' });
  });
});

//SIGNUPS
app.post('/signup', async (req, res) => {
  console.log('Received signup request');
  try {
    const { username, password } = req.body;
    console.log(`Received signup request for username: ${username}`);

    if (!username || !password || password.length < 8) {
      console.log('Username or Password not proper');
      return res.status(400).send('Username or Password not proper');
    }

    //TAKE THE PASSWORD AND ADD CRYPTOGRAPHY
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const db = await connectToDatabase();

    //INSERT INTO DATABASE
    const query = `INSERT INTO users (username, password, roles) VALUES (?, ?, 'guest')`;
    db.run(query, [username, hashedPassword], function (err) {
      if (err) {
        res.status(500).send('Database error');
      } else {
        console.log('User created successfully');
        db.close();
        res.status(200).send('User created');
      }
    });
  } catch (error) {
    console.error('Error creating user', error);
    res.status(500).send('SIGNUP ERROR');
  }
});

//LOGGIN
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password not proper.');
    }

    //HIDE PASSWORD
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const db = await connectToDatabase();

    // CHECK THE USERNAME AND PASSWORD IN THE DATABASE
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.all(query, [username, hashedPassword], (err, rows) => {
      if (err) {
        console.error('Error during login query', err);
        res.status(500).send('Internal Server Error');
        return;
      }

      // Checks if username and password exist
      if (rows.length > 0) {

        // Log the user information
        const user = rows[0];
    
        // console.log('User Information:', user.roles);
        res.status(200).json({ message: 'Login Information to Client', user: { username: user.username, roles: user.roles } });
      } else {
        console.log('User not found or incorrect password');
        res.status(401).json({ error: 'Wrong username or password' });
      }

      db.close();
    });
  } catch (error) {
    console.error('Error during login', error);
    res.status(500).send('Internal Server Error');
  }
});


//SAVE DATA INTO THE DATABASE
app.post('/submit', async (req, res) => {
  try {
    const { date, caption, gif, username } = req.body;

    if (!date || !caption || !gif || !username) {
      return res.status(400).send('Date, caption, gif and username required.');
    }

    //Connects to database and inserts date, caption, gif link, and username
    const db = await connectToDatabase();

    // Insert data into the database
    const query = 'INSERT INTO post (date, caption, gif, username) VALUES (?, ?, ?, ?)';
    db.run(query, [date, caption, gif, username], function (err) {
      if (err) {
        console.error('Error submitting post', err);
        return res.status(500).send('Error submitting post');
      }

      //takes in a unqiue postID (for deletion)
      const postId = this.lastID;
      res.status(200).json({ message: `postId-  ${postId}`, postId });
      db.close();
    });
  } catch (error) {
    console.error('Error submitting post', error);
    res.status(500).send('Error submitting post');
  }
});

// GET POSTS
app.get('/get-posts', async (req, res) => {
  try {
    const db = await connectToDatabase();

    // Get the post from the database
    const posts = [];
    await new Promise((resolve, reject) => {
      db.each('SELECT postId, date, caption, gif, username FROM post', (err, row) => {
        if (err) {
          reject(err);
        } else {
          posts.push(row);
        }
      }, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    //IF POST ARE EMPTY
    if (!posts || posts.length === 0) {
      return res.status(404).json({ error: 'No posts found' });
    }
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Error fetching posts:' });
  }
});

//DELETE THE POST THAT MATCHES THE POSTID
app.delete('/delete-post', async (req, res) => {
  const postId = req.body.postId; //GET THE POST ID

  try {
    //Connect to database and retrieve the postId
    const db = await connectToDatabase();

    const existingPost = await db.get('SELECT * FROM post WHERE postId = ?', [postId]);

    if (!existingPost) {
      console.log(`Post with postId ${postId} not found`);
      return res.status(404).json({ error: 'Post not found' });
    }

    await db.run('DELETE FROM post WHERE postId = ?', [postId]);

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'ERROR DELETING postId' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
  console.log('To Test:');
  console.log('http://localhost:3000/');
  console.log('http://localhost:3000');
});