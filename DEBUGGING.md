# Debugging Guide - Site Blocking Not Working

## Quick Fix Steps

### Step 1: Reload the Extension
After making code changes, you MUST reload the extension:
1. Go to `chrome://extensions/` (or `edge://extensions/`)
2. Find **FocusFlow** in the list
3. Click the **reload icon** (circular arrow) 🔄
4. This restarts the background service worker

### Step 2: Verify Focus Mode is ON
1. Click the FocusFlow icon in toolbar
2. Make sure the toggle is **ON** (green/checked)
3. Status should say "Active"

### Step 3: Check Browser Console
1. Open browser console: Press `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Look for messages like:
   - "Initializing FocusFlow. Focus Mode: true, Blocked Sites: [...]"
   - "Setting up webRequest listener for: [...]"
4. If you see errors, note them down

### Step 4: Test Blocking
1. **Close all Instagram tabs** (important!)
2. With Focus Mode ON, try to open: `https://www.instagram.com`
3. In a **NEW tab**, type: `instagram.com`
4. Should see "This site can't be reached" or blank page

### Step 5: Check Extension Service Worker Console
1. Go to `chrome://extensions/`
2. Find FocusFlow
3. Click **"service worker"** or **"Inspect views: service worker"**
4. This opens the background script console
5. Look for:
   - "Initializing FocusFlow..."
   - "Setting up webRequest listener..."
   - "Blocking request to: https://www.instagram.com..."
6. If you see "Blocking request" messages, the listener is working!

---

## Common Issues & Solutions

### Issue: "I can still access Instagram"
**Solution:**
1. Make sure Focus Mode is ON in popup
2. Reload the extension (Step 1 above)
3. **Close Instagram tab completely** (not just refresh)
4. Open Instagram in a NEW tab
5. Check service worker console for "Blocking request" messages

### Issue: No messages in console
**Possible causes:**
- Extension not loaded properly
- Service worker crashed
- Permissions issue

**Solution:**
1. Reload extension
2. Check manifest.json has `"webRequest"` permission
3. Check `host_permissions` includes `<all_urls>`

### Issue: Extension shows errors
**Check for:**
- Missing icons (can be ignored for testing)
- JavaScript errors in background.js
- Manifest syntax errors

**Solution:**
1. Fix any errors shown
2. Reload extension
3. Check console again

---

## Manual Test

To verify blocking is working:

1. **Open service worker console:**
   - `chrome://extensions/` → Find FocusFlow → Click "service worker"

2. **In console, type:**
   ```javascript
   chrome.storage.sync.get(['focusMode', 'blockedSites'], (result) => {
     console.log('Focus Mode:', result.focusMode);
     console.log('Blocked Sites:', result.blockedSites);
   });
   ```

3. **Expected output:**
   ```
   Focus Mode: true
   Blocked Sites: ["instagram.com", "reddit.com", ...]
   ```

4. **If Focus Mode is false:** Turn it ON in popup
5. **If Blocked Sites is empty:** Check popup → Edit sites → Verify list

---

## Testing Checklist

- [ ] Extension loaded without errors
- [ ] Focus Mode toggle works (can turn ON/OFF)
- [ ] Service worker console shows initialization messages
- [ ] Service worker console shows "Setting up webRequest listener"
- [ ] Focus Mode is ON when testing
- [ ] Instagram tab is CLOSED before trying to open it
- [ ] Tried opening Instagram in NEW tab (not refresh)
- [ ] Service worker console shows "Blocking request" when accessing Instagram

---

## Still Not Working?

If blocking still doesn't work after trying everything:

1. **Uninstall and reinstall extension:**
   - Remove FocusFlow from `chrome://extensions/`
   - Click "Load unpacked" again
   - Select extension folder

2. **Check browser compatibility:**
   - Chrome/Edge 88+ required for Manifest V3
   - Older browsers won't work

3. **Check for conflicts:**
   - Other extensions blocking requests?
   - VPN/proxy interfering?
   - Firewall/antivirus blocking?

4. **Share debug info:**
   - Service worker console errors
   - Browser console errors
   - Screenshot of extension popup showing Focus Mode state

