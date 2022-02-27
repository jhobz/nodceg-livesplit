'use strict';
const LiveSplitClient = require('livesplit-client')

module.exports = nodecg => {
	const rLivesplit = nodecg.Replicant('livesplit')
	const client = new LiveSplitClient(`${nodecg.bundleConfig.url}:${nodecg.bundleConfig.port}`)
	const infoDisplayChangeInterval = 1000
	let timerHandle, infoDisplayChangeHandle

	// Reset info since connection has been reset
	rLivesplit.value.connection.status = 'disconnected'
	rLivesplit.value.timer = undefined

	client.on('connected', () => {
		nodecg.log.info('Connected to ls')
		rLivesplit.value.connection.status = 'connected'
		timerHandle = setInterval(async () => {
			try {
				rLivesplit.value.timer = await client.getAll()
			} catch (err) {
				nodecg.log.error(err)
			}
		}, 150)
	})

	client.on('disconnected', () => {
		nodecg.log.info('Disconnected from ls')
		rLivesplit.value.connection.status = 'disconnected'
		rLivesplit.value.timer = undefined
	})

	// Required, even if the error is being caught elsewhere. Otherwise NodeCG will exit on socket error
	client.on('error', (err) => {
		nodecg.log.error(err)
	})

	// Message: connect
	nodecg.listenFor('connect', async (_, ack) => {
		if (rLivesplit.value.connection.status === 'connected') {
			ack(null)
			return
		}

		try {
			await client.connect()
		} catch(err) {
			nodecg.log.info('there was an error with the promise')
			ack(new Error('Could not connect to LiveSplit. Is the LiveSplit Server running?', err))
			return
		}

		ack(null)
	})

	// Message: disconnect
	nodecg.listenFor('disconnect', (_, ack) => {
		if (rLivesplit.value.connection.status === 'disconnected') {
			ack(null)
			return
		}

		try {
			clearInterval(timerHandle)
			client.disconnect()
		} catch (err) {
			ack(new Error('Could not disconnect from LiveSplit.', err))
		}

		ack(null)
	})

	// Message: changeInfoDisplay
	infoDisplayChangeHandle = setInterval(() => {
		nodecg.sendMessage('changeInfoDisplay')
	}, infoDisplayChangeInterval)
}
