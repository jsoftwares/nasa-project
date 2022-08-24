const http = require('http');

require('dotenv').config();

const app = require('./app');
const { loadLaunchData } = require('./models/launches.model');
const { loadPlanetData } = require('./models/planets.model');
const { mongoConnect } = require('./services/mongo');

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
    await mongoConnect();
    await loadPlanetData();
    loadLaunchData()
    server.listen(PORT, () => console.log(`API listening on PORT ${PORT}...`));
}

startServer();



