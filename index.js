/** @typedef {import('pear-interface')} */ /* global Pear */

import { spawn, spawnSync } from 'bare-subprocess'
import { summary, command, flag, arg } from 'paparam'
import process from 'bare-process'
import os from 'bare-os'
import pkg from './package' with { type: 'json' }
import Holesail from 'holesail'

function isScreenSharingEnabled() {
  const res = spawnSync('launchctl', ['list'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (res.error || res.status !== 0) {
    return false
  }

  return /^\d+\s+.*RemoteDesktop.*$/m.test(res.stdout.toString())
}

function promptEnableScreenSharing() {
  const res = spawnSync(
    'osascript',
    [
      '-e',
      `display dialog "Screen Sharing (VNC) is currently disabled.

Please enable it in:
System Settings → General → Sharing → Remote Management." \
buttons {"Open Settings", "Cancel"} \
default button "Open Settings"`
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  if (res.error || res.status !== 0) {
    return
  }

  // osascript prints the button label chosen
  if (res.stdout && res.stdout.includes('Open Settings')) {
    openSharingSettings()
  }
}

function openSharingSettings() {
  spawnSync('open', ['x-apple.systempreferences:com.apple.Sharing-Settings.extension'], {
    stdio: 'ignore'
  })
}

const share = command(
  'share',
  summary('Start a VNC server'),
  async () => {
    if (isScreenSharingEnabled()) {
      console.log('✅ Screen Sharing / Remote Management is enabled')
    } else {
      console.log('❌ Screen Sharing / Remote Management is disabled. Enable and retry')
      promptEnableScreenSharing()
      process.exit()
    }

    const server = new Holesail({
      server: true,
      port: 5900,
      secure: true,
      host: 'localhost'
    })
    await server.ready()
    console.log('pynqvnc is now active and you can connect with: ', server.info.url)
  } // end cmd
)

function launchVNC(host, port) {
  spawnSync('open', [`vnc://${host}:${port}`], {
    stdio: 'ignore'
  })
}

const connect = command(
  'connect',
  summary('Connect to a VNC server'),
  arg('<vncKey>', 'the vnc server key'),
  async (cmd) => {
    const key = cmd.args.vncKey

    const vnc = new Holesail({
      client: true,
      key: key,
      port: 5999,
      secure: true
    })

    await vnc.ready()
    const host = vnc.info.host
    const port = vnc.info.port

    console.log('pynqvnc is now active, launching vnc client')
    launchVNC(host, port)
  } // end cmd
)

const version = command(
  'version',
  summary('print version of the package'),
  async () => {
    console.log(`v${pkg.version}`)
  } // end cmd
)

const cmd = command('pynqvnc', version, share, connect)

cmd.parse()
