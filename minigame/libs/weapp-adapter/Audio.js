import HTMLAudioElement from './HTMLAudioElement'

const _innerAudioContextMap = new WeakMap()

export default class Audio extends HTMLAudioElement {
  constructor(url) {
    super()

    this.readyState = Audio.HAVE_NOTHING

    const innerAudioContext = wx.createInnerAudioContext()

    _innerAudioContextMap.set(this, innerAudioContext)

    this._canplayEvents = ['load', 'loadend', 'canplay', 'canplaythrough', 'loadedmetadata']

    innerAudioContext.onCanplay(() => {
      this._loaded = true
      if (this.readyState < Audio.HAVE_CURRENT_DATA) {
        this.readyState = Audio.HAVE_CURRENT_DATA
      }
      this.dispatchEvent({ type: 'load' })
      this.dispatchEvent({ type: 'loadend' })
      this.dispatchEvent({ type: 'loadedmetadata' })

      if (this.readyState !== Audio.HAVE_FUTURE_DATA && this.duration !== 0) {
        this.handleCanPlay()
      }
    })
    innerAudioContext.onTimeUpdate(() => {
      if (this.readyState !== Audio.HAVE_FUTURE_DATA && this.duration !== 0) {
        this.handleCanPlay()
      }
      this.dispatchEvent({ type: 'timeupdate' })
    })
    innerAudioContext.onPlay(() => {
      this._paused = innerAudioContext.paused
      this.dispatchEvent({ type: 'play' })
    })
    innerAudioContext.onPause(() => {
      this._paused = innerAudioContext.paused
      this.dispatchEvent({ type: 'pause' })
    })
    innerAudioContext.onEnded(() => {
      this._paused = innerAudioContext.paused
      this.dispatchEvent({ type: 'ended' })
      this.readyState = Audio.HAVE_ENOUGH_DATA
    })
    innerAudioContext.onError(() => {
      this.dispatchEvent({ type: 'error' })
    })

    if (url) {
      innerAudioContext.src = url
    }

    this._volume = innerAudioContext.volume
    this._paused = innerAudioContext.paused
    this._muted = false
  }

  addEventListener(type, listener, options = {}) {
    type = String(type).toLowerCase()

    super.addEventListener(type, listener, options)

    if (this._loaded && this._canplayEvents.indexOf(type) !== -1) {
      this.dispatchEvent({ type: type })
    }
  }

  handleCanPlay() {
    if (this.readyState >= Audio.HAVE_FUTURE_DATA) return
    if (this.loadMute) {
      this.loadMute = false
      _innerAudioContextMap.get(this).volume = this._volume
    }

    this.readyState = Audio.HAVE_FUTURE_DATA
    this.dispatchEvent({ type: 'canplay' })
    this.dispatchEvent({ type: 'canplaythrough' })
    this.dispatchEvent({ type: 'play' })
  }

  play() {
    this._paused = false
    return _innerAudioContextMap.get(this).play()
  }

  resume() {
    return _innerAudioContextMap.get(this).resume()
  }

  pause() {
    this._paused = true
    _innerAudioContextMap.get(this).pause()
  }

  destroy() {
    _innerAudioContextMap.get(this).destroy()
  }

  load() {
    // TODO can't preload
    if (this._loaded) return
    this.loadMute = true
    _innerAudioContextMap.get(this).volume = 0
    this.play()
  }

  canPlayType(mediaType = '') {
    if (typeof mediaType !== 'string') {
      return ''
    }

    if (mediaType.indexOf('audio/mpeg') > -1 || mediaType.indexOf('audio/mp4')) {
      return 'probably'
    }
    return ''
  }

  get currentTime() {
    return _innerAudioContextMap.get(this).currentTime
  }

  set currentTime(value) {
    _innerAudioContextMap.get(this).seek(value)
  }

  get duration() {
    return _innerAudioContextMap.get(this).duration
  }

  get src() {
    return _innerAudioContextMap.get(this).src
  }

  set src(value) {
    if (Array.isArray(value)) value = value[0]
    this._loaded = false
    this.readyState = Audio.HAVE_NOTHING
    _innerAudioContextMap.get(this).src = value
  }

  get loop() {
    return _innerAudioContextMap.get(this).loop
  }

  set loop(value) {
    _innerAudioContextMap.get(this).loop = value
  }

  get autoplay() {
    return _innerAudioContextMap.get(this).autoplay
  }

  set autoplay(value) {
    _innerAudioContextMap.get(this).autoplay = value
  }

  get paused() {
    return this._paused
  }

  get volume() {
    return _innerAudioContextMap.get(this).volume
  }

  set volume(value) {
    this._volume = value
    if (!this._muted) {
      _innerAudioContextMap.get(this).volume = value
    }
  }

  get muted() {
    return this._muted
  }

  set muted(value) {
    this._muted = value
    if (value) {
      _innerAudioContextMap.get(this).volume = 0
    } else {
      _innerAudioContextMap.get(this).volume = this._volume
    }
  }

  cloneNode() {
    const newAudio = new Audio()
    newAudio.loop = this.loop
    newAudio.autoplay = this.autoplay
    newAudio.src = this.src
    return newAudio
  }
}

Audio.HAVE_NOTHING = 0
Audio.HAVE_METADATA = 1
Audio.HAVE_CURRENT_DATA = 2
Audio.HAVE_FUTURE_DATA = 3
Audio.HAVE_ENOUGH_DATA = 4
