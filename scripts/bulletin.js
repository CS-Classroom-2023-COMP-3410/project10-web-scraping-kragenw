const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Function to perform web scraping
const scrapeData = async (url) => {
    try {
        // Fetching HTML with Axios
        const { data } = await axios.get(url);
        
        // Loading HTML into Cheerio
        const $ = cheerio.load(data);
        const courses = [];

        // Select each course block
        $('.courseblock').each((i, elem) => {
            const title = $(elem).find('.courseblocktitle strong').text();
            const desc = $(elem).find('.courseblockdesc').text();
            
            // Check for upper-division courses (3000-level or higher) and no prerequisites
            const courseCodeMatch = title.match(/COMP\s*(\d{4})/);
            if (courseCodeMatch && parseInt(courseCodeMatch[1]) >= 3000 && !desc.includes('Prerequisite')) {
                const courseCode = `COMP-${courseCodeMatch[1]}`;
                const titleText = title.replace(/COMP\s*\d{4}/, '').trim();
                
                courses.push({
                    course: courseCode,
                    title: titleText
                });
            }
        });

        // Save results to a JSON file
        fs.writeFile('results/bulletin.json', JSON.stringify({ courses }, null, 4), (err) => {
            if (err) {
                console.error('Error writing to file:', err);
            } else {
                console.log('File successfully written!');
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// URL to scrape
const url = 'https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext';

// Call the function with the URL
scrapeData(url);
