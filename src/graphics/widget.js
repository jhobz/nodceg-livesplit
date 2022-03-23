import './widget.css'
import anime from 'animejs'
import fitty from 'fitty'

/* =================== VARIABLES & SETUP =================== */
const COLORS = {
    primary: '#1976d2',
    secondary: '#15315d',
    accent: '#ffc400',
    white: '#f9f9f9',
    black: '#1a1a1a',
    ahead: '#99ff99',
    behind: '#ff9999'
}

const rLivesplit = nodecg.Replicant('livesplit')
const rLogos = nodecg.Replicant('assets:logos')
const infoDisplays = ['delta', 'bestPossibleTime', 'finalTime']
const animations = [{
    tl: createTransitionTimeline(),
    duration: 2850,
    safeTime: 2850 / 2
}, {
    tl: createGoldSplitTimeline(),
    duration: 1000
}]

let currentInfoIndex = 0

fitty('.shrink-fit > p', {
    minSize: 12,
    maxSize: 56
})

/* =================== REPLICANTS =================== */

rLivesplit.on('change', (newValue, oldValue) => {
    const connStatus = newValue.connection.status
    document.getElementById('connection-status').textContent = `${connStatus.charAt(0).toUpperCase()}${connStatus.slice(1)} ${connStatus === 'connected' ? 'to' : 'from'} LiveSplit`

    if (newValue.timer) {
        document.querySelector('#widget-timer-current .timer-main').innerText = newValue.timer.currentTime.slice(0, -3)
        document.querySelector('#widget-timer-current .timer-sub').innerText = newValue.timer.currentTime.slice(-3)

        Object.keys(newValue.timer).forEach((k, i) => {
            if (infoDisplays.includes(k)) {
                const query = `#widget-timer-${k}`
                document.querySelector(query + ' .timer-main').innerText = newValue.timer[k].slice(0, -3)
                document.querySelector(query + ' .timer-sub').innerText = newValue.timer[k].slice(-3)
            }
        })

        if (newValue.timer.delta && newValue.timer.delta.charAt(0) === '+') {
            document.getElementById('widget-timer-delta').classList.add('timer-behind')
            document.getElementById('widget-timer-delta').classList.remove('timer-ahead')
        } else {
            document.getElementById('widget-timer-delta').classList.add('timer-ahead')
            document.getElementById('widget-timer-delta').classList.remove('timer-behind')
        }
    }
})

/* =================== MESSAGES =================== */

nodecg.listenFor('changeInfoDisplay', () => {
    changeInfoDisplay()
})

nodecg.listenFor('split', segment => {
    onSplit(segment)
})

nodecg.listenFor('undoSplit', segment => {
    onUndoSplit(segment)
})

/* =================== STATE CHANGES =================== */

function changeInfoDisplay(playAnimation = true) {
    const animation = animations[0]
    const currentInfo = infoDisplays[currentInfoIndex]
    currentInfoIndex = currentInfoIndex === infoDisplays.length - 1 ? 0 : currentInfoIndex + 1
    const nextInfo = infoDisplays[currentInfoIndex]

    if (playAnimation) {
        document.querySelector('.widget-right-animations').style.visibility = 'visible'
        document.getElementById('widget-right-transition-text').innerText = nextInfo.charAt(0).toUpperCase() + nextInfo.slice(1)
        animation.tl.finished.then(() => {
            document.querySelector('.widget-right-animations').style.visiblity = 'hidden'
        })
        animation.tl.play()
    }

    setTimeout(() => {
        document.getElementById(`widget-timer-${currentInfo}`).classList.add('hidden')
        document.getElementById(`widget-timer-${nextInfo}`).classList.remove('hidden')
    }, animation.safeTime)
}

function onSplit(segment) {
    if (segment.isGold) {
        // Play gold split animation
        const animation = animations[1]
        document.querySelector('#widget-full-animations').style.visibility = 'visible'
        animation.tl.finished.then(() => {
            document.querySelector('#widget-full-animations').style.visibility = 'hidden'
        })
        animation.tl.play()

        // Add some delay for the next animation
    }

    // Display some additional info about the segment
}

function onUndoSplit(segment) {
    // Cancel any animations in progress, except the info display change
    for (let i = 1; i < animations.length; i++) {
        animations[i].tl.restart()
        animations[i].tl.pause()
    }
}

/* =================== ANIMATIONS =================== */

function createTransitionTimeline() {
    const fullWidth = anime.get(document.querySelector('.widget-right-animations'), 'width')
    const easeOut = 'easeOutCubic'
    const easeIn = 'easeInCubic'

    const tl = anime.timeline({
        easing: easeOut,
        autoplay: false
    })

    const smallBoxAnim = {
        targets: '.widget-right-animations .transition-box-small',
        translateX: [
            { value: fullWidth, duration: 500 },
            { value: 0, duration: 0 },
            { value: fullWidth, duration: 500, delay: 1850, easing: easeIn }
        ]
    }

    const largeBoxAnim = {
        targets: '.widget-right-animations .transition-box-large',
        width: [
            { value: [0, '100%'], duration: 500 },
            { value: 0, duration: 500, delay: 1500, easing: easeIn },
        ],
        translateX: [
            { value: fullWidth, duration: 500, delay: 2000, easing: easeIn }
        ]
    }

    const textAnim = {
        targets: '#widget-right-transition-text',
        translateX: [
            { value: ['-200%', 0], duration: 333 },
            { value: 20, duration: 1500, easing: 'linear' },
            { value: '200%', duration: 333, easing: easeIn }
        ]
    }

    tl.add(smallBoxAnim).add(largeBoxAnim, 133).add(textAnim, 300)

    return tl
}

function createGoldSplitTimeline() {
    const easeOut = 'easeOutCubic'
    const easeIn = 'easeInCubic'

    const tl = anime.timeline({
        easing: easeOut,
        autoplay: false,
        duration: 300
    })

    const logoOut = logoExit()
    const logoIn = {
        targets: '.widget-inner-circle',
        scale: 1,
        duration: 500,
        easing: 'easeOutElastic'
    }

    const pulse = {
        targets: '#widget-full-animations .transition-circle',
        scale: [0, 6],
        opacity: 0,
        delay: anime.stagger(200, { easing: 'easeOutQuad' })
    }

    const fillBoxIn = {
        targets: '#widget-full-animations .transition-circle-full',
        scale: [0, 6]
    }

    const textIn = {
        targets: '#widget-full-animations .text',
        scale: [
            { value: 0, duration: 0 },
            { value: 0.9, duration: 300 },
            { value: 1, duration: 5000, easing: 'linear' }
        ],
        opacity: [0, 1]
    }

    const textAndFillBoxOut = {
        targets: ['#widget-full-animations .text', '#widget-full-animations .transition-circle-full'],
        scale: 1.5,
        opacity: 0,
        duration: 1000,
        delay: anime.stagger(500)
    }

    tl.add(logoOut)
        .add(pulse, '-=500')
        .add(fillBoxIn, '-=250')
        .add(textIn, '-=100')
        .add(textAndFillBoxOut)
        .add(logoIn, '-=300')

    return tl
}

function logoExit() {
    addMotionBlur('.widget-inner-circle')

    // We set this in the CSS classes, but the animation will override it if we don't set it inline
    anime.set('.widget-inner-circle', {
        translateX: '-50%'
    })

    return {
        targets: '.widget-inner-circle',
        scale: [
            { value: 1, duration: 4000 },
            { value: 1.5, duration: 1000, easing: 'easeInQuad' },
            { value: 0, duration: 1000, easing: 'easeInElastic' }
        ],
        rotate: [
            { value: 1080 * 27, duration: 6000, easing: 'easeInExpo', delay: anime.stagger(10) },
        ],
        translateX: [
            { value: '-50%', duration: 4000 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-51, -49) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-52, -48) + '%', duration: 50 },
            { value: anime.random(-53, -47) + '%', duration: 50 },
            { value: anime.random(-53, -47) + '%', duration: 50 },
            { value: anime.random(-53, -47) + '%', duration: 50 },
            { value: anime.random(-53, -47) + '%', duration: 50 },
            { value: anime.random(-53, -47) + '%', duration: 50 },
            { value: '-50%', duration: 50 },
            { value: '-50%', duration: 700 }
        ],
        translateY: [
            { value: 0, duration: 4000 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-1, 1) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-2, 2) + '%', duration: 50 },
            { value: anime.random(-3, 3) + '%', duration: 50 },
            { value: anime.random(-3, 3) + '%', duration: 50 },
            { value: anime.random(-3, 3) + '%', duration: 50 },
            { value: anime.random(-3, 3) + '%', duration: 50 },
            { value: anime.random(-3, 3) + '%', duration: 50 },
            { value: 0, duration: 50 },
            { value: 0, duration: 700 }
        ],
        borderColor: [
            { value: COLORS.white, duration: 3000, delay: 1000, easing: 'easeInExpo' },
            { value: COLORS.accent, duration: 1000, delay: 750, easing: 'easeInExpo' },
            { value: COLORS.black, delay: 250 },
        ],
        backgroundColor: [
            { value: COLORS.accent, duration: 1000, delay: 5000, easing: 'easeInExpo' },
            { value: COLORS.secondary }
        ]
    }
}

// Creates duplicate elements to simulate motion blur
function addMotionBlur(selector, steps = 10) {
    const elem = document.querySelector(selector)
    const parent = elem.parentNode
    for (let i = 0; i < steps - 1; i++) {
        const dupe = elem.cloneNode()
        dupe.style.opacity = 1 - 1/steps - i/steps
        dupe.style.boxShadow = 'none'
        parent.appendChild(dupe)
    }
}