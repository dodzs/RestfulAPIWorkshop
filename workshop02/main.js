const range = require('express-range')
const compression = require('compression')

const express = require('express')

const CitiesDB = require('./citiesdb');

//Load application keys
//Rename _keys.json file to keys.json
const keys = require('./keys.json')

console.info(`Using ${keys.mongo}`);

const db = CitiesDB({  
	connectionUrl: keys.mongo, 
	databaseName: 'cities', 
	collectionName: 'cities'
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// Mandatory workshop
// TODO GET /api/states
app.get('/api/states',
	(req,resp) => {
		db.findAllStates()
			.then(result => {
				resp.status(200);
				resp.type('application/json');
				resp.json(
					result.map(v => `/api/state/${v}`)
					);
			})
			.catch(error => {
				resp.status(400);
				resp.type('text/plain');
				resp.send(error)
			})
	}
)

// TODO HEAD /api/state/:state
// IMPORTANT: HEAD must be place before GET for the
// same resource. Otherwise the GET handler will be invoked
app.head('/api/state/:state',
	(req,resp) => {
		//should check if :state exists
		resp.status(200);
		resp.type('application/json');
		resp.header('Accept-Ranges','cities')
		resp.end()
	}
)
// TODO GET /api/state/:state
app.get('/api/state/:state',
	range({accept : 'cities', limit:20}),
	(req,resp) => {
		const state=req.params.state;
		const firstVar=req.range.first;
		const lastVar=req.range.last;
		Promise.all([
			db.findCitiesByState(state,{offset:firstVar,limit:(lastVar-firstVar+1)}),
			db.countCitiesInState(state)
		]).then(results => {
				resp.status(206);
				resp.type('application/json');
				resp.range({
					first: firstVar,
					second: lastVar,
					length: results[1]
				})
				resp.json(
					results[0].map(v=>`/api/city/${v}`)
					);
			})
			.catch(error => {
				resp.status(400);
				resp.type('text/plain');
				resp.send(error)
			})
	}
)


// TODO GET /api/city/:cityId
app.get('/api/city/:varCityID',
	(req,resp) => {
		const city = req.params.varCityID;
		db.findCityById(city)
			.then(result => {
				resp.type('application/json');
				if(result.length>0){
					resp.status(200);
					resp.json(result[0]);
				}
				else{
					resp.status(404);
					resp.json(`message : cityID ${city} not found`);
				}				
			})
			.catch(error => {
				resp.status(400);
				resp.type('text/plain');
				resp.send({error})
			})
	}
)


// TODO POST /api/city




// Optional workshop

// TODO GET /state/:state/count



// TODO GET /city/:name



// End of workshop

db.getDB()
	.then((db) => {
		const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;

		console.info('Connected to MongoDB. Starting application');
		app.listen(PORT, () => {
			console.info(`Application started on port ${PORT} at ${new Date()}`);
		});
	})
	.catch(error => {
		console.error('Cannot connect to mongo: ', error);
		process.exit(1);
	});
