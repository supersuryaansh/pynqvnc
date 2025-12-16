/** @typedef {import('pear-interface')} */ /* global Pear */

import { spawn, spawnSync } from 'child_process'
import process from 'bare-process'
import os from 'bare-os'

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

if (isScreenSharingEnabled()) {
  console.log('✅ Screen Sharing / Remote Management is enabled')
} else {
  console.log('❌ Screen Sharing / Remote Management is disabled')
  promptEnableScreenSharing()
}
