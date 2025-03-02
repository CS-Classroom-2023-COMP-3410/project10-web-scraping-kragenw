const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseUrl = 'https://www.du.edu/calendar?search=&start_date=2025-01-01&end_date=2025-12-31#events-listing-date-filter';

async function fetchEvents() {
    try {
        const mainResponse = await axios.get(baseUrl);
        const $ = cheerio.load(mainResponse.data);
        const events = [];

        $('.event-card').each((i, element) => {
            const url = $(element).attr('href');
            const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
            const date = $(element).find('p').eq(0).text().trim();
            const title = $(element).find('h3').text().trim();
            const timeText = $(element).find('span.icon-du-clock').parent().text().trim();

            let event = {
                url: fullUrl,
                title,
                date
            };

            if (timeText) { // Only add time if it exists
                event.time = timeText;
            }

            events.push(event);
        });

        for (const event of events) {
            try {
                const detailResponse = await axios.get(event.url);
                const detail$ = cheerio.load(detailResponse.data);
                const description = detail$('.description').text().trim().replace(/\s\s+/g, ' ');
                if (description) { // Only add description if it exists
                    event.description = description;
                }
                delete event.url; // Remove the URL property
            } catch (error) {
                console.error(`Error fetching details from ${event.url}:`, error);
            }
        }

        return events;
    } catch (error) {
        console.error('Error fetching main events page:', error);
        return [];
    }
}

async function saveEvents(events) {
    if (!fs.existsSync('results')) {
        fs.mkdirSync('results', { recursive: true });
    }
    fs.writeFileSync('results/calendar_events.json', JSON.stringify({ events }, null, 2), 'utf8');
    console.log('Event details saved to results/calendar_events.json');
}

async function main() {
    const events = await fetchEvents();
    await saveEvents(events);
}

main();
