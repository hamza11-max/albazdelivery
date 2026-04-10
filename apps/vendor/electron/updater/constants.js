const UPDATE_EVENTS = {
  AVAILABLE: 'update-available',
  PROGRESS: 'update-progress',
  DOWNLOADED: 'update-downloaded',
  STATUS: 'update-status',
}

const UPDATE_CHANNELS = {
  STABLE: 'latest',
  BETA: 'beta',
}

const UPDATE_CHANNEL_STORE_KEY = 'updater.channel'

module.exports = {
  UPDATE_EVENTS,
  UPDATE_CHANNELS,
  UPDATE_CHANNEL_STORE_KEY,
}
