import './livesplit.css'

const rLivesplit = nodecg.Replicant('livesplit')
const button = document.getElementById('btn-connect')

rLivesplit.on('change', (newValue, oldValue) => {
    const connStatus = newValue.connection.status
    if (connStatus === 'connected') {
        button.innerText = 'Disconnect'
    } else {
        button.innerText = 'Connect'
    }
    document.getElementById('connection-status').textContent = `${connStatus.charAt(0).toUpperCase()}${connStatus.slice(1)} ${connStatus === 'connected' ? 'to' : 'from'} LiveSplit`

    if (newValue.timer) {
        Object.keys(newValue.timer).forEach( key => {
            document.getElementById(key).textContent = newValue.timer[key]
        })
        document.getElementById('timer-info').style.display = 'block'
    } else {
        document.getElementById('timer-info').style.display = 'none'
    }
})

button.onclick = (ev) => {
    if (button.innerText === 'Connect') {
        nodecg.sendMessage('connect')
            .then(result => {
                console.log('connection successful')
            }).catch(error => {
                console.error(error)
            })
    } else {
        nodecg.sendMessage('disconnect')
    }
}