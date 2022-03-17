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
		timerHandle = setInterval(updateTimer, pollingInterval)
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

	async function updateTimer() {
		let next
		try {
			next = await client.getAll()
		} catch (err) {
			nodecg.log.error(err)
			return
		}

		const segmentInfo = detectSplit(rLivesplit.value.timer, next)

		// "error" is somewhat of a misnomer here. Sometimes updates are handled out of order.
		// This makes it much harder to detect splits, so we'll instead defer the update in these cases.
		// Since we poll so frequently, the delay in information will be inperceptible anyways.
		// This property is also used in cases where the timer is not running.
		if (segmentInfo.error) {
			if (!segmentInfo.skipUpdate) {
				rLivesplit.value.timer = next
			}
			return
		}

		rLivesplit.value.timer = next

		if (segmentInfo.isComplete) {
			nodecg.sendMessage('split', segmentInfo)
		} else if (segmentInfo.isUndone) {
			nodecg.sendMessage('undoSplit', segmentInfo)
		}
	}
}

function detectSplit(prevTime, nextTime) {
	const segment = {}
	if (!prevTime ||
		!prevTime.currentTime ||
		!nextTime.currentTime) {
		segment.error = true
		return segment
	}

	// Data received out of order from server
	if (timeDiff(nextTime.currentTime, prevTime.currentTime) < 0) {
		segment.error = true
		segment.skipUpdate = true
		return segment
	}

	// Detect segment end (split key pressed, but not skip key)
	segment.isComplete = nextTime.splitIndex > 0 && parseInt(nextTime.splitIndex) > prevTime.splitIndex && nextTime.previousSplitTime !== '0.00'

	// For now, we're just skipping over segments that include a skipped split (i.e. multiple segments in a single "split" event).
	// TODO: Find a better solution for this? Might require a Livesplit.Server channge
	if (prevTime.previousSplitTime === '0.00' && prevTime.splitIndex > 0) {
		segment.isComplete = false
	}

	if (segment.isComplete) {
		segment.duration = timeDiff(nextTime.previousSplitTime, prevTime.previousSplitTime || '0')

		// TODO: Remove this once information is received from the server all at once.
		// Since we poll the server for each piece of information individually, there are times where a segment could end
		// in the middle of this polling. This means some of the information will be from the old segment, and some will
		// be from the new one. For now, to fix this we'll just skip over the update and grab the next one in these cases.
		if (segment.duration.time === 0) {
			segment.error = true
			segment.skipUpdate = true
			return segment
		}

		segment.isGold = timeDiff(nextTime.bestPossibleTime, prevTime.bestPossibleTime) < 0
	} else if (parseInt(nextTime.splitIndex) < prevTime.splitIndex) {
		segment.isUndone = true
	} else {
		segment.duration = timeDiff(nextTime.currentTime, prevTime.previousSplitTime || '0')
	}

	// Undone splits - used to cancel animations in progress

	return segment
}


// TODO: Split these utility functions into a "Time" class, potentially converting all time strings into Time objects
//       so that the comparators can be overridden as well (via .valueOf())
function timeSum(t1, t2) {
	const time = _convertTimeToMs(t1) + _convertTimeToMs(t2)
	return { time, text: _convertMsToTime(time) }
}

function timeDiff(t1, t2) {
	const time = _convertTimeToMs(t1) - _convertTimeToMs(t2)
	return { time, text: _convertMsToTime(time) }
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