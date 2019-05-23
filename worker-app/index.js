const keys = require("./keys");
const redis = require("redis");

const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000
});
const redisSubscriber = redisClient.duplicate();

function fib(index) {

	if (index < 2) {
		return 1;
	}

	return fib(index - 1) + fib(index - 2);
}

// will be called everytime we set a key in redis
// basically, the frontend will set the key with an empty values
// and this callback will be used calc the fib async'ly
// "message" <--- the "index" in the fb series entered from the UI
redisSubscriber.on("message", (channel, message) => {
	const key = message;
	const val = fib(parseInt(message));
	redisClient.hset("fibResults", key, val);
});

// subscribe to all insert events on redis
redisSubscriber.subscribe("insert");
