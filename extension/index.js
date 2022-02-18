'use strict';
const LiveSplitClient = require('livesplit-client')

module.exports = nodecg => {
	const rLivesplit = nodecg.Replicant('livesplit')
	
	;(async () => {
		try {
			const client = new LiveSplitClient(`${nodecg.bundleConfig.url}:${nodecg.bundleConfig.port}`)

			client.on('connected', () => {
				nodecg.log.info('Connected to ls')
				rLivesplit.value.connection.status = 'connected'
			})

			client.on('disconnected', () => {
				nodecg.log.info('Disconnected from ls')
				rLivesplit.value.connection.status = 'disconnected'
			})
			
			await client.connect()
			const info = await client.getAll()
			nodecg.log.info('Summary:', info)
			rLivesplit.value.timer = info

			setInterval(async () => {
				rLivesplit.value.timer = await client.getAll()
			}, 1000)
		} catch (err) {
			nodecg.log.info(err)
		}
	})()
}
