const axios = require('axios');
const Launches = require("./launches.mongo");
const Planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

async function populateLaunches() {
    console.log('Downloading launch data');

    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('Problem downloading launch data');
        throw new Error('Launch data download failed')
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        //combines multiple array into one array
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        });

        const launch = {
            flightNumber: launchDoc.flight_number,
            mission: launchDoc.name,
            rocket: launchDoc.rocket.name,
            launchDate: new Date(launchDoc.date_local),  //date_local
            target: 'Kepler-62 f',  //not applicable
            customers: ['EP', 'Apple', 'NASA', 'ZTM'],  //payloads.customers for each payload
            upcoming: launchDoc.upcoming,
            success: launchDoc.success,
            customers
        };

        console.log(`${launch.flightNumber}, ${launch.mission}`);
        await saveLaunch(launch);
    }
}

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function loadLaunchData() {

    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    });

    if (firstLaunch) {
        console.log('Launch data already loaded!');
    }else {
        await populateLaunches(); 
    }
}

async function findLaunch(filter){
    return await Launches.findOne(filter);
}

async function existsLaunchById(launchId) {
    return await findLaunch({flightNumber: launchId});
}

async function getLatestFlightNumber() {
    const latestLaunch = await Launches
        .findOne()
        .sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
    // return Array.from(launches.values());
    return await Launches.find({}, {_id: 0, __v: 0})
    .sort({flightNumber: 1})
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
    await Launches.findOneAndUpdate({
        flightNumber: launch.flightNumber
    }, launch, {
        upsert: true
    });
}

async function scheduleNewLaunch(launch) {
    const planet = await Planets.findOne({keplerName: launch.target});
    if(!planet) throw new Error('No matching planet was found.');

    const newFlightNumber = await getLatestFlightNumber() + 1;
    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ['ExchangePoint', 'NASA'],
        flightNumber: newFlightNumber
    });

    await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
    //we will soft delete d launch; just update its properties. This approach is common in d era of Big Data
    const aborted = await Launches.updateOne({
        flightNumber: launchId
    }, {
        upcoming: false,
        success: false
    });
    return aborted.modifiedCount === 1 && aborted.matchedCount === 1 && aborted.acknowledged;
}

module.exports = {
    loadLaunchData,
    findLaunch,
    existsLaunchById,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunchById
}