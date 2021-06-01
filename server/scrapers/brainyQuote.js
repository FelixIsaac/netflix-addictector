import { promises as fs, existsSync } from 'fs';
import { resolve as resolvePath } from 'path';
import cheerio from 'cheerio';
import axios from '../utils/axiosWrapper.js';

/**
 * Get quotes from topic page
 * @param  {string} topic  Topic name
 * @param  {number|string} page  Topic pagination number
 * @return {{ quote: string, author: string }[]}
 */
export async function getQuotesFromPage(topic, page) {
	try {
		const { status, data } = await axios.get(`/topics/${topic}_${page}`)
		const $ = cheerio.load(data);
		if (status !== 200) return;
		
		const quotes = $('div.grid-item.qb.clearfix.bqQt').map(function(i, element) {
			return {
				quote: $(element).children('a[title="view quote"]')?.text(),
				author: $(element).children('a[title="view author"]')?.text()
			}
		});

		return quotes;
	} catch (err) {
		console.error(err);
	}
}

/**
 * Get all quotes from a topic
 * @param  {string} topic Quote topic/category
 * @return {{ quote: string, author: string }[]}
 */
export async function getQuotesFromTopic(topic) {
	try {
		const { status, data } = await axios.get(`/topics/${topic}`)
		const $ = cheerio.load(data);
		if (status !== 200) return;

		// get unique ahref pagination
		const pages = $('ul.pagination a[href]')
				.filter(function() { return $(this).text().trim() !== 'Next'; })
				.map((i, element) => $(element).text())
				.get()
				
		pages.unshift('1') // get current page

		const quotes = Promise.all(pages.map(async (page) => (await getQuotesFromPage(topic, page)).get()));
		return (await quotes).flat();
	} catch (err) {
		console.error(err);
	}
}

/**
 * Save quotes to local json file
 * @param  {{ quote: string, author: string }[]} quotes         Array of quotes
 * @param  {string} quotesFileName JSON file path
 * @return {boolean} True or false represents succes or failed respectively
 */
export async function saveQuotes(quotes, quotesFileName = './quotes/quotes.json') {
	try {
		const path = resolvePath(quotesFileName);

		if (existsSync(path)) saveFile(JSON.parse((await fs.readFile(path, 'utf8')) || '[]'));
 		else saveFile();

		// update data and write to file
 		async function saveFile(data = []) {
 			const writeData = JSON.stringify(data.concat(quotes), null, 4);
			await fs.writeFile(path, writeData, { encoding: 'utf8', flag: 'w' });
 		}

		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
}

/**
 * Get all quots from BrainQuote.com
 * @return {boolean} True or false represents succes or failed respectively
 */
export async function getAllQuotesFromSite() {
	try {
		const topics = ['binge-quotes', 'motivational-quotes', 'attitude-quotes', 'inspirational-quotes', 'positive-quotes', 'life-quotes'];

		topics.forEach(async (topic) => {
			const quotes = await getQuotesFromTopic(topic);
			saveQuotes(quotes, `./quotes/${topic}.json`);
		});

		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
}

export default {
	getQuotesFromPage,
	getQuotesFromTopic,
	saveQuotes,
	getAllQuotesFromSite
}
