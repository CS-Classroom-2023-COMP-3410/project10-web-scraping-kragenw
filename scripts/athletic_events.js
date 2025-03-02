const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchAndParseData() {
    try {
        const url = 'https://denverpioneers.com/index.aspx'; // Change to the actual URL
        const response = await axios.get(url);
        const html = response.data;

        const $ = cheerio.load(html);
        let scriptData = "";

        $("script").each((index, element) => {
            const scriptContent = $(element).html();
            if (scriptContent.includes('"type":"events"')) {
                scriptData = scriptContent;
            }
        });

        const jsonStartPos = scriptData.indexOf('{');
        const jsonEndPos = scriptData.lastIndexOf('}') + 1;
        const jsonString = scriptData.substring(jsonStartPos, jsonEndPos);
        const jsonData = JSON.parse(jsonString);

        const events = jsonData.data.map(event => {
            const duTeam = event.sport.title; // Assuming this is where the DU team name is stored
            const opponent = event.opponent.name; // Assuming this is where the opponent name is stored
            const date = event.date; // Use date and check for time

            return {
                duTeam: duTeam,
                opponent: opponent,
                date: new Date(date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) + (event.time ? `, ${event.time}` : '')
            };
        });

        // Save the structured data to a JSON file
        saveEvents({ events });

    } catch (error) {
        console.error('Error fetching or parsing data:', error);
    }
}

function saveEvents(data) {
    fs.writeFile('results/athletic_events.json', JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('An error occurred while writing JSON Object to File.', err);
        } else {
            console.log('JSON file has been saved.');
        }
    });
}

fetchAndParseData();
