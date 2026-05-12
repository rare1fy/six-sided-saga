const location = {
  href: 'game.js',

  search: '',

  reload() {},

  replace(href) {
    this.href = href
  },
}

export default location
