// keytar-wrapper.js
// Provides small async wrappers around keytar with an electron-store fallback.
const os = require('os')

function makeStore() {
  const Store = require('electron-store')
  return new Store({ name: 'vendor-auth' })
}

let keytar = null
try {
  keytar = require('keytar')
} catch (e) {
  // keytar may not be available in some CI or dev environments
  // We'll gracefully fall back to electron-store when needed.
  keytar = null
}

const wrapper = {
  async getPassword(service, account) {
    if (keytar) {
      try {
        return await keytar.getPassword(service, account)
      } catch (err) {
        console.warn('[keytar-wrapper] keytar.getPassword failed', err)
      }
    }

    const store = makeStore()
    const auth = store.get('vendor_auth_state')
    return auth && auth.token ? auth.token : null
  },

  async setPassword(service, account, password) {
    if (keytar) {
      try {
        return await keytar.setPassword(service, account, password)
      } catch (err) {
        console.warn('[keytar-wrapper] keytar.setPassword failed', err)
      }
    }

    const store = makeStore()
    let auth = store.get('vendor_auth_state') || {}
    auth.token = password
    auth.isAuthenticated = true
    auth.savedAt = Date.now()
    store.set('vendor_auth_state', auth)
    return true
  },

  async deletePassword(service, account) {
    if (keytar) {
      try {
        return await keytar.deletePassword(service, account)
      } catch (err) {
        console.warn('[keytar-wrapper] keytar.deletePassword failed', err)
      }
    }

    const store = makeStore()
    store.delete('vendor_auth_state')
    return true
  }
}

module.exports = wrapper
// keytar-wrapper.js
// Provides simple get/set/delete password functions with a fallback to electron-store
const KEYTAR = (() => {
  try {
    return require('keytar')
  } catch (e) {
    return null
  }
})()

const Store = (() => {
  try {
    return require('electron-store')
  } catch (e) {
    return null
  }
})()

function getStoreInstance() {
  if (!Store) return null
  return new Store({ name: 'vendor-auth' })
}

module.exports = {
  async getPassword(service, account) {
    if (KEYTAR) {
      try { return await KEYTAR.getPassword(service, account) } catch (e) { console.warn('[keytar-wrapper] keytar.getPassword failed', e) }
    }
    const store = getStoreInstance()
    if (!store) return null
    const auth = store.get('vendor_auth_state')
    return auth && auth.token ? auth.token : null
  },

  async setPassword(service, account, password) {
    if (KEYTAR) {
      try { return await KEYTAR.setPassword(service, account, password) } catch (e) { console.warn('[keytar-wrapper] keytar.setPassword failed', e) }
    }
    const store = getStoreInstance()
    if (!store) return null
    const auth = store.get('vendor_auth_state') || {}
    auth.token = password
    store.set('vendor_auth_state', auth)
    return true
  },

  async deletePassword(service, account) {
    if (KEYTAR) {
      try { return await KEYTAR.deletePassword(service, account) } catch (e) { console.warn('[keytar-wrapper] keytar.deletePassword failed', e) }
    }
    const store = getStoreInstance()
    if (!store) return null
    const auth = store.get('vendor_auth_state') || {}
    delete auth.token
    store.set('vendor_auth_state', auth)
    return true
  }
}
