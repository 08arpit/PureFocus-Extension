# Testing Guide for FocusFlow Extension

## Step 1: Prepare Extension for Testing

### Option A: Create Placeholder Icons (Recommended for testing)
Create simple placeholder icons or temporarily comment out icon references in `manifest.json`.

### Option B: Load Without Icons
The extension will work but may show a broken icon badge.

---

## Step 2: Load Extension in Browser

1. **Open Extensions Page**
   - Chrome: Type `chrome://extensions/` in address bar
   - Edge: Type `edge://extensions/` in address bar

2. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

3. **Load Extension**
   - Click **"Load unpacked"** button
   - Navigate to and select the `extension` folder:
     ```
     C:\Users\8arpi\OneDrive\Documents\extension
     ```
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "FocusFlow" in your extensions list
   - If there are errors, check the error message (common: missing icons)

---

## Step 3: Test Focus Mode Toggle

1. **Open the Extension Popup**
   - Click the FocusFlow icon in your browser toolbar
   - If no icon, check the extensions menu (puzzle piece icon)

2. **Toggle Focus Mode**
   - Click the toggle switch next to "Focus Mode"
   - Status should change from "Off" to "Active"
   - Toggle off and on again to verify it works

3. **Check Stats**
   - Verify "Today's Focus" and "This Week" show "0m" initially
   - These will update when Focus Mode is active

---

## Step 4: Test Site Blocking

1. **Enable Focus Mode**
   - Open popup → Toggle Focus Mode ON

2. **Try Visiting Blocked Sites**
   - Open a new tab
   - Try to visit: `https://www.instagram.com`
   - **Expected**: Page should be blocked (blank or error page)
   
3. **Test Other Blocked Sites**
   - `https://www.reddit.com` - Should be blocked
   - `https://www.netflix.com` - Should be blocked
   - `https://www.twitter.com` - Should be blocked (if in default list)

4. **Test Normal Site**
   - Visit `https://www.google.com` - Should work normally

5. **Turn Off Focus Mode**
   - Open popup → Toggle Focus Mode OFF
   - Try visiting instagram.com again - Should work normally

---

## Step 5: Test YouTube Smart Filter

### Test 5a: Educational Video (No Warning)

1. **Enable Focus Mode**
   - Toggle Focus Mode ON in popup

2. **Visit YouTube**
   - Go to `https://www.youtube.com`
   - Search for an educational video like:
     - "Calculus tutorial"
     - "Python programming tutorial"
     - "Khan Academy" video
     - "MIT lecture"

3. **Watch the Video**
   - Click on an educational video
   - **Expected**: No warning popup appears
   - Video should play normally

4. **Check Recommendations Hidden**
   - Look at the right sidebar - Should be HIDDEN
   - Scroll down - Comments section should be HIDDEN
   - End-screen recommendations should be HIDDEN

### Test 5b: Distracting Video (Warning Appears)

1. **Still in Focus Mode**
   - Make sure Focus Mode is still ON

2. **Find a Distracting Video**
   - Search for videos like:
     - "Funny memes compilation"
     - "TikTok cringe"
     - "Music video"
     - "Gaming montage"

3. **Click on Video**
   - **Expected**: A warning popup should appear saying:
     - "This doesn't look like a study video. Want to stay focused?"
     - Two buttons: "Stay Focused" and "Continue Anyway"

4. **Test Popup Actions**
   - Click "Stay Focused" → Should navigate back/away from video
   - Go back and click video again
   - Click "Continue Anyway" → Warning closes, video plays
   - Warning should NOT appear again for same video

5. **Check Recommendations**
   - Even after clicking "Continue Anyway"
   - Recommendations and comments should still be HIDDEN

---

## Step 6: Test Blocked Sites Management

1. **Open Extension Popup**
   - Click FocusFlow icon

2. **Edit Blocked Sites**
   - Click the ✏️ (pencil) icon next to "Blocked Sites"

3. **Add a Site**
   - Type a domain (e.g., `twitter.com`)
   - Click "Add Site"
   - Site should appear in the list

4. **Test New Blocked Site**
   - Enable Focus Mode
   - Try visiting the newly added site - Should be blocked

5. **Remove a Site**
   - In edit panel, click "Remove" next to a site
   - Site should disappear from list

6. **Verify Removal**
   - With Focus Mode ON
   - Visit the removed site - Should work normally now

---

## Step 7: Test Analytics

1. **Enable Focus Mode**
   - Open popup → Toggle ON

2. **Wait and Check Stats**
   - Wait 10-15 seconds
   - Open popup again
   - **Expected**: "Today's Focus" should show time (e.g., "1m")
   - "This Week" should also show time

3. **Keep Focus Mode Active**
   - Leave it on for 1-2 minutes
   - Open popup periodically
   - Stats should increase

4. **Turn Off Focus Mode**
   - Toggle OFF
   - Stats should freeze (not increase anymore)

---

## Step 8: Test Video Change Detection

1. **Enable Focus Mode**
   - Toggle ON

2. **On YouTube**
   - Watch an educational video (no warning)

3. **Navigate to Distracting Video**
   - Click on a different distracting video
   - **Expected**: Warning popup appears again
   - This confirms video change detection works

4. **Use Browser Back Button**
   - Navigate back to previous video
   - Warning should reset (can appear again if video changes)

---

## Troubleshooting Tests

### If Icons Error Appears:
1. Create 3 simple PNG files (16x16, 48x48, 128x128 pixels)
2. Name them: `icon16.png`, `icon48.png`, `icon128.png`
3. Place in `icons/` folder
4. Reload extension

### If Site Blocking Doesn't Work:
1. Check browser console for errors (F12)
2. Verify Focus Mode is ON in popup
3. Reload the extension
4. Check that site is in blocked sites list

### If YouTube Filter Doesn't Work:
1. Make sure Focus Mode is ON
2. Reload YouTube page (F5)
3. Open browser console (F12) → Check for errors
4. Verify you're on `youtube.com` (not `youtu.be`)

### If Analytics Don't Update:
1. Analytics save every 10 seconds
2. Wait at least 10 seconds before checking
3. Make sure Focus Mode is actually ON
4. Refresh popup to see updated stats

---

## Expected Behavior Summary

✅ **Focus Mode OFF**: All sites work normally, YouTube shows everything

✅ **Focus Mode ON**: 
- Blocked sites are inaccessible
- YouTube recommendations/comments hidden
- Educational videos play without warning
- Distracting videos show warning popup
- Analytics track focus time
- Stats update every 10 seconds

---

## Quick Test Checklist

- [ ] Extension loads without errors
- [ ] Popup opens and shows UI
- [ ] Focus Mode toggle works
- [ ] Blocked sites are blocked when Focus Mode is ON
- [ ] Blocked sites work when Focus Mode is OFF
- [ ] YouTube recommendations/comments hide when Focus Mode is ON
- [ ] Educational videos play without warning
- [ ] Distracting videos show warning popup
- [ ] Warning popup "Stay Focused" button works
- [ ] Warning popup "Continue Anyway" button works
- [ ] Analytics update over time
- [ ] Can add/remove blocked sites
- [ ] Video change detection works

