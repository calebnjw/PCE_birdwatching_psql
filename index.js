// CREATE TABLE [table] ([column] [type], ...);
// SELECT * FROM [table] (WHERE [column]=[value]);
// SELECT * FROM [table] ORDER BY [column] ASC/DESC;
// SELECT [table1.column], [table2.column]... FROM [table1]
// >> INNER JOIN [table2] ON [table1.column]=[table2.column]
// INSERT INTO [table] ([column], [column]) VALUES ([value], [value]);
// UPDATE [table] SET [column]=[value] WHERE [column]=[value];
// DELETE FROM [table] WHERE [column]=[value];
// ALTER TABLE [table] RENAME [column] TO [newName];
// ALTER TABLE [table] ADD [column] [type];

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
// ------------------------------ //
// setting up app---------------- //
// ------------------------------ //
// ------------------------------ //

// express and express packages
import express from 'express';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import jsSHA from 'jssha';

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
// ------------------------------ //
// helper functions-------------- //
// ------------------------------ //
// ------------------------------ //

const getHashed = (input) => {
  const hash = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  hash.update(input);
  const output = hash.getHash('HEX');

  return output;
};

// ------------------------------ //
// ------------------------------ //
// routes: notes----------------- //
// ------------------------------ //
// ------------------------------ //

// display all notes on the homepage
app.get('/', (request, response) => {
  console.log('GET: ALL NOTES');

  const query = 'SELECT * FROM notes ORDER BY note_id ASC;';

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
    habitat, date, appearance, behaviour, vocalisation, flock_size, species_id,
  } = note;

  // send to database
  const query = `INSERT INTO notes 
    (habitat, date, appearance, behaviour, vocalisation, flock_size, species_id) 
    VALUES ('${habitat}', '${date}', '${appearance}', '${behaviour}', '${vocalisation}', '${flock_size}', '${species_id}');`;

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
  const query = `SELECT * FROM notes WHERE note_id=${id};`;

  pool.query(query)
    .then((result) => {
      const note = result.rows[0];
      // and display on page
      response.render('note-view', { note });
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
  const query = `SELECT * FROM notes WHERE note_id=${id};`;

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
    habitat, date, appearance, behaviour, vocalisation, flock_size, species_id,
  } = note;

  // update values of table at specific id
  const query = `UPDATE notes 
    SET habitat='${habitat}', 
      date='${date}', 
      appearance='${appearance}', 
      behaviour='${behaviour}', 
      vocalisation='${vocalisation}', 
      flock_size = '${flock_size}',
      species_id = '${species_id}' 
    WHERE note_id=${id};`;

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

  const query = `DELETE FROM notes WHERE note_id=${id};`;

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
// ------------------------------ //
// routes: species--------------- //
// ------------------------------ //
// ------------------------------ //

// display new species form
app.get('/species', (request, response) => {
  console.log('GET: NEW SPECIES FORM');

  response.render('species-new');
});

// send contents of new species to database
app.post('/species', (request, response) => {
  console.log('POST: NEW SPECIES FORM');

  // get contents of form
  const species = JSON.parse(JSON.stringify(request.body));
  const { name, scientific_name } = species;

  // send to database
  const query = `INSERT INTO species 
    (name, scientific_name) 
    VALUES ('${name}', '${scientific_name}');`;

  pool.query(query)
    .then((result) => {
      response.redirect('/');
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// get all species
app.get('/species/all', (request, response) => {
  console.log('GET: ALL SPECIES');

  // get all species from database
  const query = 'SELECT * FROM species ORDER BY species_id ASC;';

  pool.query(query)
    .then((result) => {
      const species = result.rows;
      // console.log(species);
      response.render('species-all', { species });
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// get notes from species
app.get('/species/:id', (request, response) => {
  const { id } = request.params;
  console.log('GET: ALL NOTES FROM SPECIES');

  const data = {};

  // get name of species from database
  const speciesQuery = `SELECT * FROM species WHERE species_id=${id};`;
  pool.query(speciesQuery)
    .then((result) => {
      data.species = result.rows[0];
      // console.log('DATA SPECIES', data);
    })
    .then(() => {
      // get notes from selected species
      const query = `SELECT notes.note_id, 
        notes.date, 
        notes.habitat, 
        species.species_id, 
        species.name 
        FROM notes 
        INNER JOIN species
        ON notes.species_id=species.species_id
        WHERE notes.species_id=${id}
        ORDER BY notes.note_id ASC;`;

      pool.query(query)
        .then((result) => {
          data.notes = result.rows;
          // console.log('notes', data.notes);
          response.render('species-view', { data });
        })
        .catch((error) => {
          console.log(error);
          response.send(error);
        });
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// display edit species form
app.get('/species/:id/edit', (request, response) => {
  const { id } = request.params;
  console.log('GET: EDIT SPECIES FORM');

  // get name of species from database
  const query = `SELECT * FROM species WHERE species_id=${id};`;
  pool.query(query)
    .then((result) => {
      const species = result.rows[0];
      response.render('species-edit', { species });
    });
});

// send contents of new species to database
app.put('/species/:id/edit', (request, response) => {
  const { id } = request.params;
  console.log('POST: EDITED SPECIES');

  // get contents of form
  const species = JSON.parse(JSON.stringify(request.body));
  const { name, scientific_name } = species;

  // send to database
  const query = `UPDATE species 
    SET name='${name}', 
      scientific_name='${scientific_name}'
    WHERE species_id=${id};`;

  pool.query(query)
    .then((result) => {
      response.redirect('/species/all');
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// delete species from database
app.delete('/species/:id/delete', (request, response) => {
  const { id } = request.params;
  console.log('POST: EDITED SPECIES');

  // delete from database
  const query = `DELETE FROM species 
    WHERE species_id=${id};`;

  pool.query(query)
    .then((result) => {
      console.log('Deleted');
      response.redirect('/species/all');
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

// ------------------------------ //
// ------------------------------ //
// routes: users----------------- //
// ------------------------------ //
// ------------------------------ //

app.get('/signup', (request, response) => {
  console.log('GET: SIGNUP FORM');

  response.render('user-signup');
});

app.post('/signup', (request, response) => {
  console.log('POST: NEW USER');

  const {
    first_name, last_name, username, password,
  } = JSON.parse(JSON.stringify(request.body));
  const hashedPassword = getHashed(password);

  const query = `INSERT INTO users (first_name, last_name, username, password) 
    VALUES ('${first_name}', '${last_name}', '${username}', '${hashedPassword}')`;

  pool.query(query)
    .then((result) => {
      response.redirect('/login');
    });
});

app.get('/login', (request, response) => {
  console.log('GET: LOGIN FORM');

  response.render('user-login');
});

app.post('/login', (request, response) => {
  console.log('POST: USER DETAILS');

  const {
    username, password,
  } = JSON.parse(JSON.stringify(request.body));
  console.log(username, password);

  const hashedPassword = getHashed(password);

  const query = `SELECT * FROM users WHERE username='${username}'`;

  pool.query(query)
    .then((result) => {
      if (result.rows.length !== 0) {
        if (result.rows[0].password === hashedPassword) {
          response.cookie('loggedIn', true);
          response.redirect('/');
        } else {
          response.send('Wrong username or password. Try again.');
        }
      } else {
        response.send('Wrong username or password. Try again.');
      }
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
});

app.delete('/logout', (request, response) => {
  response.clearCookie('loggedIn');
});

// ------------------------------ //
// ------------------------------ //
// setting up server------------- //
// ------------------------------ //
// ------------------------------ //

// app port and listen
const PORT = 3004;

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});
