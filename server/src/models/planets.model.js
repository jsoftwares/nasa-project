const fs = require('fs');
const path = require('path');
const { parse} = require('csv-parse');
const Planets = require('./planets.mongo');

function loadPlanetData() {
    return new Promise((resolve, reject) => {

        function isHabitablePlanet(planet) {
            return planet['koi_disposition'] === 'CONFIRMED' &&
            planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11 && 
            planet['koi_prad'] < 1.6;
        }

        fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
            .pipe(parse({
                comment: '#',
                columns: true,
            }))
            .on('data', async (data) => {
                if (isHabitablePlanet(data)) {
                    savePlanet(data);
                }
            })
            .on('error', (err) => {
                console.log(err);
                reject(err);
            })
            .on('end', () => {
                resolve();
            });
        });
}
async function getAllPlanets() {
    return await Planets.find();
}

async function savePlanet(planet) {
    try {
        await Planets.updateOne({
            keplerName: planet.kepler_name
        }, {
            keplerName: planet.kepler_name
        }, {
            upsert: true
        });
        
    } catch (err) {
        console.error(`We could not save planet ${err}`);
    }
}

module.exports = {
    getAllPlanets,
    loadPlanetData
};