import Fastify from 'fastify';
import serverless from 'serverless-http';
const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
	reply.send({ hello: 'world' });
});

// fastify.use('/.netlify/functions/server', fastify); 

const handler = serverless(fastify);
export default fastify;
export { handler };

// Run the server!
fastify.listen(3000, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`)
})
