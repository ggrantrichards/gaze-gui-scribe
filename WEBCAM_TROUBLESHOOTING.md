# Webcam Permission Troubleshooting

## Common Issues and Solutions

### Issue: "NotAllowedError" or Permission Denied

**Cause:** User blocked camera access or browser denied permission

**Solutions:**

#### Chrome:
1. Click the camera icon (🎥) in the address bar
2. Select "Always allow https://clientsight-5a400.web.app to access your camera"
3. Click "Done"
4. Refresh the page

#### Firefox:
1. Click the lock icon (🔒) in the address bar
2. Click "Connection secure" → "More information"
3. Go to "Permissions" tab
4. Find "Use the Camera" and select "Allow"
5. Refresh the page

#### Edge:
1. Click the lock icon (🔒) in the address bar
2. Select "Permissions for this site"
3. Find "Camera" and select "Allow"
4. Refresh the page

---

### Issue: "NotFoundError" or No Camera Found

**Cause:** No webcam connected or webcam not detected

**Solutions:**
1. Check if webcam is physically connected
2. Try a different USB port
3. Check if webcam works in other apps (Zoom, Skype, etc.)
4. On laptop: Ensure webcam is not disabled in BIOS
5. Windows: Check Device Manager for webcam status
6. Mac: Check System Preferences → Security & Privacy → Camera

---

### Issue: "NotReadableError" or Camera In Use

**Cause:** Another app is using the camera

**Solutions:**
1. Close all other apps that might use the camera:
   - Zoom, Skype, Teams, Discord
   - Other browser tabs with camera access
   - Camera/Photo apps
2. Restart your browser
3. If on Windows, open Task Manager and end camera-related processes
4. Restart your computer if issue persists

---

### Issue: "SecurityError" or Blocked by Browser

**Cause:** Site accessed via HTTP or browser security blocking

**Solutions:**
1. **Ensure you're using HTTPS:**
   - ✅ `https://clientsight-5a400.web.app`
   - ❌ `http://clientsight-5a400.web.app` (won't work!)

2. **Check browser permissions:**
   - Chrome: `chrome://settings/content/camera`
   - Firefox: `about:preferences#privacy` → Permissions
   - Edge: `edge://settings/content/camera`

3. **Clear site data and try again:**
   - Chrome: Settings → Privacy → Site Settings → View permissions
   - Find your site and click "Reset permissions"

---

### Issue: Works on localhost but not deployed site

**Cause:** HTTPS requirement or permission not granted for production domain

**Solutions:**
1. Make sure you're accessing via HTTPS (Firebase Hosting uses HTTPS by default)
2. Clear browser cache and cookies for the site
3. Open in incognito/private window to test fresh permissions
4. Check browser console (F12) for specific error messages

---

### Issue: "OverconstrainedError"

**Cause:** Webcam doesn't support requested resolution (1280x720)

**Solution:**
- This is rare, but if it happens, the app will work fine
- Webcam will use its native resolution
- Contact support if calibration fails

---

## Testing Camera Access

### Quick Test:
Visit these sites to verify your camera works:
- https://www.webcamtests.com/
- https://webcamtests.com/

If camera works there but not on ClientSight, it's likely a permissions issue.

---

## Browser Compatibility

### ✅ Fully Supported:
- Chrome 60+
- Firefox 55+
- Edge 79+
- Safari 11+ (macOS)
- Opera 47+

### ⚠️ Limited Support:
- Safari on iOS (may have issues with WebGazer)
- Mobile browsers (eye tracking less accurate on phones)

### ❌ Not Supported:
- Internet Explorer (deprecated)
- Very old browser versions

---

## Privacy & Security

### What We Access:
- ✅ Real-time video feed from your webcam
- ✅ Eye position data (processed locally)

### What We DON'T Do:
- ❌ Record or store video
- ❌ Take screenshots
- ❌ Send video to servers
- ❌ Access camera when not in use

All eye-tracking happens **locally in your browser** using [WebGazer.js](https://webgazer.cs.brown.edu/).

---

## Still Having Issues?

### Debug Steps:

1. **Open browser console** (F12 → Console tab)
2. **Look for error messages** starting with `[Webcam]`
3. **Copy the full error message**

### Common Console Errors:

```
[Webcam] Permission error: NotAllowedError
→ User needs to allow camera access

[Webcam] Permission error: NotFoundError
→ No camera detected

[Webcam] Permission error: NotReadableError
→ Camera in use by another app
```

---

## For Developers

### Testing Locally:
```bash
# Frontend must be on HTTPS or localhost
npm run dev  # Works (localhost)
```

### Testing on Deployed Site:
```bash
# Always served over HTTPS by Firebase
https://clientsight-5a400.web.app  # ✅ Works
http://clientsight-5a400.web.app   # ❌ Blocked (no HTTPS)
```

### Debugging:
```javascript
// Check if getUserMedia is available
console.log('getUserMedia:', navigator.mediaDevices?.getUserMedia)

// Check permissions
navigator.permissions.query({ name: 'camera' })
  .then(result => console.log('Camera permission:', result.state))
```

---

## Contact Support

If none of these solutions work:
1. Note your browser and OS version
2. Copy any error messages from console
3. Describe what you see when requesting permission
4. Contact at [your-support-email]

---

## Known Issues

### Mac Safari:
- May ask for permission multiple times
- Eye tracking may be less accurate
- **Recommendation:** Use Chrome for best experience

### Windows 10/11:
- Check "Camera privacy settings" in Windows Settings
- Ensure "Allow apps to access your camera" is ON
- Ensure "Allow desktop apps to access your camera" is ON

### Linux:
- Ensure video device permissions are set correctly
- Check `ls -l /dev/video*` for device access
- May need to add user to `video` group

---

Last updated: [Date]

