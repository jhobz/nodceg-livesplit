import './widget.css'
import anime from 'animejs'
import fitty from 'fitty'

/**
 * Animation class
 */
class Animation {
    #buildTimeline
    duration
    safeTime
    tl

    constructor(type, duration = 500) {
        this.duration = duration

        switch(type) {
            case 'transition':
                this.#buildTimeline = createTransitionTimeline
                this.safeTime = this.duration / 2
                break;
            case 'gold':
                this.#buildTimeline = createGoldSplitTimeline
                break;
            default:
                throw new Error('Unrecognized animation type')
        }

        this.tl = this.#buildTimeline(this.duration)
    }
}

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
const animations = [
    new Animation('transition', 2850),
    new Animation('gold', 13325),
]

let isTakeoverMode = false
let currentInfoIndex = 0
let currentDelta

fitty('.shrink-fit > p', {
    minSize: 24,
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
    if (!isTakeoverMode) {
        changeInfoDisplay()
    }
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
        // Prevent other animations
        isTakeoverMode = true

        // Play gold split animation
        const animation = animations[1]
        const animationElement = document.querySelector('#widget-full-animations')
        animationElement.style.visibility = 'visible'
        animation.tl.play()

        // Add some delay for the next animation?

        // Resume other animations
        animation.tl.finished.then(() => {
            animationElement.style.visibility = 'hidden'
            isTakeoverMode = false
        })
    }

    // Display some additional info about the segment
    const trayElement = document.querySelector('.widget-right-tray')
    trayElement.querySelector('.shrink-fit > p').innerText = segment.delta.text
    if (segment.delta.time < 0) {
        trayElement.classList.add('timer-ahead')
        trayElement.classList.remove('timer-behind')
    } else {
        trayElement.classList.remove('timer-ahead')
        trayElement.classList.add('timer-behind')
    }
    trayElement.classList.add('show')
    setTimeout(() => {
        trayElement.classList.remove('show')
    }, 5000)
}

function onUndoSplit(segment) {
    // Cancel any animations in progress, except the info display change
    for (let i = 1; i < animations.length; i++) {
        animations[i].tl.restart()
        animations[i].tl.pause()
    }

    isTakeoverMode = false
}

/* =================== ANIMATIONS =================== */

function createTransitionTimeline(duration = 2850) {
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
            { value: fullWidth, duration: .175 * duration },
            { value: 0, duration: 0 },
            { value: fullWidth, duration: .175 * duration, delay: .649 * duration, easing: easeIn }
        ]
    }

    const largeBoxAnim = {
        targets: '.widget-right-animations .transition-box-large',
        translateX: [
            { value: ['-100%', 0], duration: .175 * duration },
            { value: fullWidth, duration: .175 * duration, delay: .526 * duration, easing: easeIn }
        ]
    }

    const textAnim = {
        targets: '#widget-right-transition-text',
        translateX: [
            { value: ['-200%', 0], duration: .117 * duration },
            { value: 20, duration: .526 * duration, easing: 'linear' },
            { value: '200%', duration: .117 * duration, easing: easeIn }
        ]
    }

    tl.add(smallBoxAnim).add(largeBoxAnim, .047 * duration).add(textAnim, .105 * duration)

    return tl
}

function createGoldSplitTimeline(duration = 13325) {
    const easeOut = 'easeOutCubic'

    const tl = anime.timeline({
        easing: easeOut,
        autoplay: false,
        duration: .0225 * duration
    })

    const logoOut = logoExit(.4503 * duration)
    const logoIn = {
        targets: '.widget-inner-circle',
        scale: 1,
        duration: .0375 * duration,
        easing: 'easeOutElastic'
    }

    const pulse = {
        targets: '#widget-full-animations .transition-circle',
        scale: [0, 6],
        opacity: 0,
        delay: anime.stagger(.015 * duration, { easing: 'easeOutQuad' })
    }

    const fillBoxIn = {
        targets: '#widget-full-animations .transition-circle-full',
        scale: [0, 6]
    }

    const textIn = {
        targets: '#widget-full-animations .text',
        scale: [
            { value: 0, duration: 0 },
            { value: 0.9 },
            { value: 1, duration: .375 * duration, easing: 'linear' }
        ],
        opacity: [0, 1]
    }

    const textAndFillBoxOut = {
        targets: ['#widget-full-animations .text', '#widget-full-animations .transition-circle-full'],
        scale: 1.5,
        opacity: 0,
        duration: .075 * duration,
        delay: anime.stagger(.0375 * duration)
    }

    tl.add(logoOut)
        .add(pulse, `-=${.0375 * duration}`)
        .add(fillBoxIn, `-=${.0188 * duration}`)
        .add(textIn, `-=${.0075 * duration}`)
        .add(textAndFillBoxOut)
        .add(logoIn, `-=${.0225 * duration}`)

    return tl
}

function logoExit(duration = 6000) {
    if (duration < 1950) {
        throw new Error('logoExit has a minimum duration of 1950')
    }
    addMotionBlur('.widget-inner-circle')

    // We set this in the CSS classes, but the animation will override it if we don't set it inline
    anime.set('.widget-inner-circle', {
        translateX: '-50%'
    })

    return {
        targets: '.widget-inner-circle',
        translateX: [
            { value: '-50%', duration: .333 * duration },
            ...generateVibrationKeyframes(-10, 10, .667 * duration, 80),
            { value: '-50%', duration: 0 }
        ],
        translateY: [
            { value: 0, duration: .333 * duration },
            ...generateVibrationKeyframes(-10, 10, .667 * duration, 80),
            { value: 0, duration: 0 },
        ],
        scale: [
            { value: 1, duration: .667 * duration },
            { value: 1.5, duration: .167 * duration, easing: 'easeInQuad' },
            { value: 0, duration: .167 * duration, easing: 'easeInElastic' }
        ],
        rotate: [
            { value: 360 * 45, duration, easing: 'easeInCirc', delay: anime.stagger(10) },
        ],
        borderColor: [
            { value: COLORS.white, duration: .5 * duration, delay: .167 * duration, easing: 'easeInExpo' },
            { value: COLORS.accent, duration: .167 * duration, delay: .125 * duration, easing: 'easeInExpo' },
            { value: COLORS.black, delay: .042 * duration },
        ],
        backgroundColor: [
            { value: COLORS.accent, duration: .167 * duration, delay: .833 * duration, easing: 'easeInExpo' },
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

// Creates random vibrations with a ramp in ferocity over the duration
function generateVibrationKeyframes(min, max, duration, steps = 20, shouldEase = true) {
    const shifts = []
    const stepDuration = duration / steps
    const stepClamp = steps / 10

    for (let i = 0; i < steps; i++) {
        let weightedChunk = (max - min) / (stepClamp - i / (steps - 1) * (stepClamp - 1))
        if (!shouldEase) {
            weightedChunk = max - min 
        }
        const random = Math.random() * weightedChunk - weightedChunk / 2
        shifts.push({ value: `+=${random}`, duration: stepDuration / 2, easing: 'easeInOutQuart'}) 
        shifts.push({ value: `-=${random}`, duration: stepDuration / 2, easing: 'easeInOutQuart'}) 
    }

    return shifts
}

// Not in use.
// TODO: Convert to generate a single thrash, then make another function for multiple.
//       Generalize for more uses, including option to return to center or not.
// Creates some thrashes for the circle logo, with a little bit of randomness
function generateThrashes(min, max, duration, offset) {
    const spread = (max - min) / 2
    const direction = Math.sign(Math.random() - 0.5) || 1
    const distance = Math.random() * spread
    const value = spread + direction * distance

    return [
        { value: offset ? `+=${value}` : `+=${max}`, duration: 0.2 * duration, easing: 'easeOutElastic' },
        { value: offset ? `-=${value}` : `-=${max}`, duration: 0.2 * duration, easing: 'easeInOutExpo' },
        { value: offset ? `+=${min}` : `+=${value}`, duration: 0.2 * duration, delay: 0.1 * duration, easing: 'easeOutElastic' },
        { value: offset ? `-=${min}` : `-=${value}`, duration: 0.2 * duration, easing: 'easeInOutExpo' },
        { value: offset ? `+=${max}` : `+=${min}`, duration: 0.1 * duration, easing: 'easeOutElastic' },
    ]
}



// DEBUG GARBAGE
document.getElementById('tlPlay').addEventListener('click', (ev) => {
    animations.forEach(animation => animation.tl.play())
})
document.getElementById('tlPause').addEventListener('click', (ev) => {
    animations.forEach(animation => animation.tl.pause())
})