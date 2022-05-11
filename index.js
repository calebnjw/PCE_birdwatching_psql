// CREATE TABLE [table] ([column] [type]...);
// SELECT * FROM [table] (WHERE [column]=[value]);
// SELECT * FROM [table] ORDER BY [column] ASC/DESC;
// INSERT INTO [table] ([column], [column]) VALUES ([value], [value]);
// UPDATE [table] SET [column]=[value] WHERE [column]=[value];
// DELETE FROM [table] WHERE [column]=[value];
// ALTER TABLE [table] RENAME [column] TO [newName];

// route syntax
// app.get('/path/:parameter', (request, response) => {
//   const { parameter } = request.params; // get parameter from url
//   response.cookie('name', 'value'); // set cookie
//   request.cookies; // because of cookier parser, this will be an object with all cookies
//   response.render('page', { content });
// });

// query syntax
// const query = `SELECT * FROM cats;`;
// pool.query(query, (error, result) => {
//   console.log(result.rows);
// })

// read and write files
// import { readFile, writeFile } from 'fs';

// express and express packages
import express from 'express';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';

// postgres
import pg from 'pg';

// create express app
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// create postgres
const { Pool } = pg; // postgresql

const pgConnectionConfigs = {
  user: 'calebnjw',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port
};

const pool = new Pool(pgConnectionConfigs);
// no need to pool.connect();

// routes
app.get('/', (request, response) => {
  console.log('GET: ALL NOTES');

  const query = 'SELECT * FROM notes;';

  pool.query(query)
    .then((result) => {
      const notes = result.rows;
      response.render('index', { notes });
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

app.get('/note', (request, response) => {
  console.log('GET: NEW NOTE FORM');

  response.render('new-note');
});

app.post('/note', (request, response) => {
  console.log('POST: NEW NOTE FORM');

  const note = JSON.parse(JSON.stringify(request.body));
  const {
    habitat, date, appearance, behaviour, vocalisation, flock_size,
  } = note;

  const query = `INSERT INTO notes 
    (habitat, date, appearance, behaviour, vocalisation, flock_size) 
    VALUES ('${habitat}', '${date}', '${appearance}', '${behaviour}', '${vocalisation}', '${flock_size}');`;

  pool.query(query)
    .then((result) => {
      response.redirect('/');
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

app.get('/note/:index', (request, response) => {
  const { index } = request.params;
  console.log(`GET: NOTE ${index}`);

  const query = 'SELECT * FROM notes;';

  pool.query(query)
    .then((result) => {
      const note = result.rows[index];
      note.index = index;
      response.render('note', { note });
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// app port and listen
const PORT = 3004;

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});
