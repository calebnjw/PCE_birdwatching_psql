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

// ------------------------------ //
// setting up app---------------- //
// ------------------------------ //

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

// ------------------------------ //
// routes ----------------------- //
// ------------------------------ //

// display all notes on the homepage
app.get('/', (request, response) => {
  console.log('GET: ALL NOTES');

  const query = 'SELECT * FROM notes ORDER BY id ASC;';

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

// display new note form
app.get('/note', (request, response) => {
  console.log('GET: NEW NOTE FORM');

  response.render('note-new');
});

// send contents of new note to database
app.post('/note', (request, response) => {
  console.log('POST: NEW NOTE FORM');

  // get contents of form
  const note = JSON.parse(JSON.stringify(request.body));
  const {
    habitat, date, appearance, behaviour, vocalisation, flock_size,
  } = note;

  // send to database
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

// display single note
app.get('/note/:id', (request, response) => {
  // id of note from url (passed into URL from ejs)
  const { id } = request.params;
  console.log(`GET: NOTE ${id}`);

  // get contents of note
  const query = `SELECT * FROM notes WHERE id=${id};`;

  pool.query(query)
    .then((result) => {
      const note = result.rows[0];
      // and display on page
      response.render('note', { note });
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// display edit form of existing note
app.get('/note/:id/edit', (request, response) => {
  // id of note from url (passed into URL from ejs)
  const { id } = request.params;
  console.log(`GET: EDIT NOTE ${id}`);

  // get contents to fill up the form (same as /note/id)
  const query = `SELECT * FROM notes WHERE id=${id};`;

  pool.query(query)
    .then((result) => {
      const note = result.rows[0];
      // but render the edit page instead
      response.render('note-edit', { note });
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// send contents of edited note to database
app.put('/note/:id/edit', (request, response) => {
  const { id } = request.params;
  console.log(`POST: EDIT NOTE ${id}`);

  // get contents of form
  const note = JSON.parse(JSON.stringify(request.body));
  const {
    habitat, date, appearance, behaviour, vocalisation, flock_size,
  } = note;

  // update values of table at specific id
  const query = `UPDATE notes 
    SET habitat='${habitat}', 
      date='${date}', 
      appearance='${appearance}', 
      behaviour='${behaviour}', 
      vocalisation='${vocalisation}', 
      flock_size = '${flock_size}' 
    WHERE id=${id};`;

  pool.query(query)
    .then((result) => {
      response.redirect(`/note/${id}`);
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// delete note at id
app.delete('/note/:id/delete', (request, response) => {
  const { id } = request.params;
  console.log(`POST: DELETE NOTE ${id}`);

  const query = `DELETE FROM notes WHERE id=${id};`;

  pool.query(query)
    .then((result) => {
      response.redirect('/');
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// ------------------------------ //
// routes: species--------------- //
// ------------------------------ //

// display new species form
app.get('/species', (request, response) => {
  console.log('GET: NEW SPECIES FORM');

  response.render('species-new');
});

// ------------------------------ //
// setting up server------------- //
// ------------------------------ //

// app port and listen
const PORT = 3004;

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});
