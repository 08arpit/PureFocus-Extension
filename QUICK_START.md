# Quick Start Guide

## Setup Steps

1. **Create Icon Files** (Required)
   - Create 3 icon files: `icon16.png`, `icon48.png`, `icon128.png`
   - Place them in the `icons/` folder
   - Or temporarily comment out icon references in `manifest.json` for testing

2. **Load Extension in Chrome/Edge**
   - Open `chrome://extensions/` or `edge://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory

3. **Start Using**
   - Click the FocusFlow icon in your toolbar
   - Toggle "Focus Mode" on
   - Visit YouTube to see the smart filtering in action
   - Try visiting a blocked site (e.g., instagram.com) - it will be blocked

## Testing

### Test Site Blocking
1. Toggle Focus Mode ON
2. Try visiting: `instagram.com`, `reddit.com`, `netflix.com`
3. Sites should be blocked (page won't load)

### Test YouTube Filter
1. Toggle Focus Mode ON
2. Visit YouTube
3. Watch an educational video (e.g., "Calculus Tutorial") - no warning
4. Watch a distracting video (e.g., "Funny Memes Compilation") - warning popup appears
5. Check that recommendations and comments are hidden

### Test Analytics
1. Toggle Focus Mode ON
2. Wait a few minutes
3. Open popup - check "Today's Focus" and "This Week" stats

## Troubleshooting

**Icons not showing?**
- Make sure icon files exist in `icons/` folder
- Check file names match exactly: `icon16.png`, `icon48.png`, `icon128.png`

**Site blocking not working?**
- Make sure Focus Mode is ON in the popup
- Check that the site is in your blocked sites list
- Reload the extension if needed

**YouTube filtering not working?**
- Make sure Focus Mode is ON
- Reload the YouTube page
- Check browser console for errors (F12)

**Analytics not updating?**
- Analytics update every 10 seconds while Focus Mode is active
- Wait a bit and refresh the popup

