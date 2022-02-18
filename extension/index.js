'use strict';
const LiveSplitClient = require('livesplit-client')

module.exports = nodecg => {
	nodecg.log.info('Hello, from your bundle\'s extension!'); // Semi-colon needed here because of self-calling function
	(async () => {
		try {
			const client = new LiveSplitClient(`${nodecg.bundleConfig.url}:${nodecg.bundleConfig.port}`)

			client.on('connected', () => {
				nodecg.log.info('Connected to ls')
			})

			client.on('disconnected', () => {
				nodecg.log.info('Disconnected from ls')
			})
			
			await client.connect()
			const info = await client.getAll()
			nodecg.log.info('Summary:', info)

			client.disconnect()
		} catch (err) {
			nodecg.log.info(err)
		}
	})()
}
