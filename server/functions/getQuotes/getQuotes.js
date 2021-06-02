const { promises: fs } = require('fs');
const { resolve: resolvePath } = require('path');

const handler = async (event) => {
    try {
        const quoteFiles = await fs.readdir(resolvePath('../../quotes/'));
        console.log(quoteFiles);
        
        return {
            status: 200,
            body: JSON.stringify(quoteFiles)
        }
    } catch (error) {
        return {
          statusCode: 500,
          body: error.toString()
        };
    }
}

module.exports = { handler }
