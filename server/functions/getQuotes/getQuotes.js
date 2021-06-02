import { promises as fs } from 'fs';
import { resolve } from 'path';

export default handler = async (event) => {
    try {
        const quoteFiles = await fs.readdir(resolve('../../quotes/'));
        console.log(quoteFiles);
        return {
            status: 200,
            body: JSON.stringify(quoteFiles);
        }
    } catch (error) {
        return {
          statusCode: 500,
          body: error.toString()
        };
    }
}
