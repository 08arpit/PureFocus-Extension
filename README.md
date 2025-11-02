# PureFocus - Smart Focus Mode for Students

![PureFocus Logo](icons/logo-128.png)

PureFocus is a Chrome extension designed to help students stay focused on educational content by intelligently filtering distractions and analyzing YouTube videos in real-time. Using advanced content analysis, it distinguishes between educational and distracting content to keep you on track with your learning goals.

## � Features

### Smart Focus Mode
- 🧠 AI-powered content analysis
- 🎯 Real-time YouTube video classification
- � Social media and distraction blocking
- ⏰ Customizable focus schedules

### YouTube Integration
- 🎓 Automatic educational content detection
- 🚫 Hides distracting recommendations
- 💡 Smart video suggestions filtering
- 🔍 In-depth content analysis

### Productivity Tools
- ⏱️ Focus time tracking
- 📊 Weekly progress analytics
- 🎯 Daily focus goals
- � Custom study schedules

### Privacy-First Design
- 🔒 No data collection
- 💻 Local processing only
- 🛡️ No external API calls
- 🤝 Full transparency

## 🚀 Installation

### From Source
1. Clone the repository:
   ```bash
   git clone https://github.com/08arpit/PureFocus-Extension.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

### From Chrome Web Store
*(Coming Soon)*

## 🔧 Usage

1. **Enable Focus Mode**
   - Click the PureFocus icon
   - Toggle the Focus Mode switch
   - Start your focused study session

2. **Customize Settings**
   - Block/unblock specific sites
   - Set study schedules
   - Configure YouTube filters
   - Adjust notification preferences

3. **Track Progress**
   - View daily focus time
   - Check weekly statistics
   - Monitor learning patterns

## 🛠️ Development

### Project Structure
```
PureFocus/
├── manifest.json          # Extension configuration
├── background.js         # Service worker
├── popup/
│   ├── popup.html       # Extension popup UI
│   ├── popup.css        # Popup styles
│   └── popup.js         # Popup functionality
├── content/
│   ├── youtube-content.js   # YouTube integration
│   └── youtube-content.css  # YouTube styles
├── ai-classifier.js     # Content analysis
└── blocked.html         # Blocked site page
```

### Building
1. Make changes to the source code
2. Test using Chrome's developer mode
3. Package for distribution:
   ```bash
   zip -r purefocus.zip . -x "*.git*"
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/08arpit/PureFocus-Extension/issues) with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

## 🙏 Acknowledgments

- Icons by [FontAwesome](https://fontawesome.com)
- AI model inspired by educational content classifiers
- Special thanks to all contributors

## 🔐 Privacy

PureFocus is committed to user privacy:
- No data leaves your browser
- No tracking or analytics
- All processing is done locally
- No external services used

## 📞 Contact

- GitHub: [@08arpit](https://github.com/08arpit)
- Email: [your-email@example.com]

---

Made with ❤️ for focused learning

**Intelligently distinguish between learning and distraction**

FocusFlow is a browser extension that monitors your online activity when "Focus Mode" is on, blocking distracting websites and analyzing YouTube videos in real-time to help you stay focused on educational content.

## ✨ Features

### 🧱 Focus Mode
- Toggle Focus Mode on/off from the popup
- Blocks distracting websites based on a configurable list

### 🚫 Site Blocker
- Automatically blocks distracting sites (Instagram, Reddit, Netflix, etc.)
- Customizable block list

### 🎥 YouTube Smart Filter
- Analyzes video title, description, and channel name
- Uses keyword-based classification to detect educational content
- Shows a gentle warning popup for non-educational videos
- Optionally uses AI model for more accurate detection

### 👁️ Recommendation Hider
- Removes YouTube recommendations while in Focus Mode
- Hides comments section
- Cleaner viewing experience

### 🧩 Dashboard (Popup UI)
- Shows Focus Mode state
- Displays time focused (daily/weekly)
- Allows editing blocked sites

### 📊 Analytics
- Tracks daily and weekly focus time
- Automatic reset at midnight

## 🚀 Installation

### Load as Unpacked Extension

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory

### Add Icons

Before using the extension, you need to add icon files:
- Create icon files (16x16, 48x48, 128x128 pixels)
- Place them in the `icons/` directory as:
  - `icon16.png`
  - `icon48.png`
  - `icon128.png`

Or temporarily comment out the icon references in `manifest.json` if you want to test without icons.

## 📖 Usage

1. Click the FocusFlow icon in your browser toolbar
2. Toggle "Focus Mode" on
3. When browsing YouTube, FocusFlow will:
   - Analyze videos you watch
   - Warn you if content seems non-educational
   - Hide recommendations and comments
4. Blocked sites will be automatically blocked when Focus Mode is active
5. View your focus statistics in the popup

## ⚙️ Configuration

### Add/Remove Blocked Sites

1. Open the FocusFlow popup
2. Click the edit icon (✏️) next to "Blocked Sites"
3. Add new sites by typing the domain (e.g., `twitter.com`)
4. Remove sites by clicking "Remove" in the edit panel

### Default Blocked Sites

- instagram.com
- reddit.com
- netflix.com
- twitter.com
- facebook.com

## 🛠️ Technical Details

### Architecture

- **Manifest V3** - Modern Chrome extension standard
- **Content Scripts** - YouTube page modification
- **Background Service Worker** - Site blocking and analytics
- **Storage API** - Persistent settings and stats

### Video Classification

The extension uses a keyword-based classifier that:
- Scans video title, description, and channel name
- Matches against educational and distracting keyword lists
- Provides a classification score
- Can be extended with AI/ML models for better accuracy

### Educational Keywords Include:
- tutorial, lesson, course, learn, study
- physics, math, chemistry, programming
- lecture, documentary, analysis

### Distracting Keywords Include:
- meme, funny, prank, challenge
- gaming, entertainment, comedy
- music video, vlog, shorts

## 🔮 Future Enhancements

- [ ] AI/ML-based video classification
- [ ] Custom keyword lists per user
- [ ] Whitelist specific YouTube channels
- [ ] Scheduled Focus Mode
- [ ] Export analytics data
- [ ] Browser action badge with focus time
- [ ] Notifications for focus milestones

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**Stay focused, learn better! 🎯**

