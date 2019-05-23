const keys = require("./keys");

// Express
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Create app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres
const { Pool } = require("pg");
const pgClient = new Pool({
	host: keys.postgresHost,
	port: keys.postgresPort,
	database: keys.postgresDatabase,
	user: keys.postgresUser,
	password: keys.postgresPassword
});
pgClient.on('error', () => console.log("Postgres error..."));

// Create table the 1st time
// Only stores the "indices" that have been requested so far, not the actual fib value at that index
pgClient
	.query('CREATE TABLE IF NOT EXISTS fib_requests (fib_idx INT4)')
	.catch(err => console.log(err));

// Redis
const redis = require("redis");
const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Routes

// Test route
app.get("/health", (req, res) => {
	res.send("ok");
});

// Get all indices whose fib has been requsted so far
app.get("/fibRequests", async (req, res) => {
	const result = await pgClient.query("SELECT * FROM fib_requests");
	res.send(result.rows);
});

// Get all indices whose fib has been requsted so far
// Also, no support for promises in redisClient hence using callbacks
app.get("/fibResults", async (req, res) => {
	redisClient.hgetall("fibResults", (err, result) => {
		res.send(result);	
	});
});

// New request to calulate fib
app.post("/fibRequests", async (req, res) => {
	
	const index = req.body.index;
	if (parseInt(index) > 30) {
		return res.status(422).send("index too tigh, we are not running supercomputers here...");
	}

	// Save in redis & notify the worker of the new request
	redisClient.hset("fibResults", index, "yet to be computed by the worker-app");
	redisPublisher.publish("insert", index);

	// Update DB
	pgClient.query("INSERT INTO fib_requests(fib_idx) VALUES ($1)", [index]);


	res.send({ack: true});

});

// Listener
app.listen(5000, err => {
	console.log("Server started and listening...");
});

