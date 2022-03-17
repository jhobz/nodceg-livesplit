'use strict';
const LiveSplitClient = require('livesplit-client')

module.exports = nodecg => {
	const rLivesplit = nodecg.Replicant('livesplit')
	const client = new LiveSplitClient(`${nodecg.bundleConfig.url}:${nodecg.bundleConfig.port}`)
	const pollingInterval = 15
	const infoDisplayChangeInterval = 4000
	let timerHandle, infoDisplayChangeHandle

	// Reset info since connection has been reset
	rLivesplit.value.connection.status = 'disconnected'
	rLivesplit.value.timer = undefined

	client.timeout = pollingInterval * 2
	client.on('connected', () => {
		nodecg.log.info('Connected to ls')
		rLivesplit.value.connection.status = 'connected'
		timerHandle = setInterval(async () => {
			try {
				rLivesplit.value.timer = await client.getAll()
			} catch (err) {
				nodecg.log.error(err)
			}
		}, pollingInterval)
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

function _convertTimeToMs(time) {
	if (parseInt(time.charAt(0)) === NaN) {
		time = time.slice(1)
	}

	time = time.split(':').reverse()

	if (time.length <= 0 || time.length > 3) {
		throw new Error('convertTimeToSeconds: Unrecognized time string!')
	}

	return time.reduce((sum, next, index) => sum + next * Math.pow(60, index) * 1000, 0)
}

function _convertMsToTime(ms) {
	const neg = ms < 0 ? '-' : ''
	let hrs = 0, mins = 0, secs = Math.abs(Math.floor(ms / 1000))
	ms = Math.abs((ms % 1000) / 10)

	if (secs >= 60 * 60) {
		hrs = Math.floor(secs / (60 * 60))
		secs -= hrs * 60 * 60
		hrs = hrs < 10 ? '0' + hrs : hrs
	}
	if (secs >= 60) {
		mins = Math.floor(secs / 60)
		secs -= mins * 60
		mins = hrs && mins < 10 ? '0' + mins : mins
	}
	if (secs < 10) {
		secs = '0' + secs
	}
	if (ms < 10) {
		ms = '0' + ms
	}

	return `${neg}${hrs ? hrs + ':' : ''}${hrs || mins ? mins + ':' : ''}${secs}.${ms}`
}