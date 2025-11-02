# Video Classification Guide

## Overview

FocusFlow uses an intelligent keyword-based classification system to distinguish between educational and distracting YouTube videos.

## Classification System

### 🎓 Educational Keywords (100+ keywords)

**Learning & Teaching**
- tutorial, lesson, course, learn, study, education, academic, teach
- lecture, how to, explain, concept, theory, guide, demonstration, walkthrough

**STEM Subjects**
- physics, math, chemistry, biology, science, engineering
- programming, coding, algorithm, software, development
- calculus, algebra, statistics, linear algebra
- python, java, javascript, C++, react, angular, vue

**Academic Subjects**
- history, literature, philosophy, psychology, economics
- geography, astronomy, anatomy

**Educational Platforms**
- Khan Academy, Coursera, edX, Udemy, MIT, Harvard, Stanford
- Cambridge, Oxford, Codecademy

**Skill Building**
- workshop, seminar, masterclass, certification
- professional development, career development

**Technical Training**
- best practices, design patterns, architecture
- system design, devops, security, networking
- game development, unity, unreal engine

---

### 🎮 Distracting Keywords (80+ keywords)

**Entertainment**
- meme, funny, comedy, prank, challenge, entertainment

**Gaming (Non-educational)**
- gameplay, let's play, speedrun, montage
- twitch stream, e-sports, game review

**Social Media**
- tiktok, shorts, reels, viral, trending
- react, reaction, first time watching

**Music & Lifestyle**
- music video, song, dance, vlog
- unboxing, haul, shopping, lifestyle

**Pranks & Reactions**
- compilation, best moments, fails
- try not to laugh, satisfying video

---

## Classification Algorithm

### Scoring System

1. **Base Score**: `Educational Keywords - Distracting Keywords`
2. **Pattern Bonus**: 
   - +2 for educational patterns without distracting patterns
   - -2 for distracting patterns without educational patterns
3. **Channel Bonus**: +3 for known educational channels

### Special Cases

**✅ Override to Educational:**
- Strong educational pattern with 3+ educational keywords
- Programming/coding content with educational context
- Game development tutorials
- Known educational channels (Khan Academy, MIT, etc.)

**⚠️ Override to Distracting:**
- Strong distracting patterns (meme, compilation, prank)
- Pure entertainment content
- Lifestyle vlogs without educational value

### Classification Result

- **Educational**: Score > 0 OR strong educational signals
- **Distracting**: Score ≤ 0 AND no strong educational signals

---

## Console Logging

The classifier provides detailed logging:

```
📹 Analyzing video: dQw4w9WgXcQ
Video info - Title: Python Tutorial for Beginners, Channel: FreeCodeCamp
📊 Keyword counts - Educational: 5, Distracting: 0
📈 Final score: 5 (Educational pattern: true, Distracting pattern: false, Known channel: false)
✅ Educational video detected, no warning needed
```

```
📹 Analyzing video: abc123xyz
Video info - Title: FUNNY MEMES COMPILATION 2024, Channel: Meme Channel
📊 Keyword counts - Educational: 0, Distracting: 3
📈 Final score: -3 (Educational pattern: false, Distracting pattern: true, Known channel: false)
📊 Classification result: Distracting ⚠️
🚨 Non-educational video detected - pausing and showing warning
```

---

## Testing Examples

### ✅ Should Pass (Educational)
- "Python Programming Tutorial"
- "Calculus Explained - Derivatives"
- "MIT Linear Algebra Lecture"
- "Khan Academy Biology"
- "Game Development in Unity"
- "How to Code a Website"
- "Data Structures and Algorithms"

### ⚠️ Should Block (Distracting)
- "Funny Memes Compilation"
- "TikTok Viral Videos"
- "Epic Gaming Montage"
- "Morning Routine Vlog"
- "Try Not to Laugh Challenge"
- "Unboxing and Haul"
- "Music Video"

---

## Improving Classification

To improve accuracy, you can:

1. **Add more keywords** to educational/distracting lists
2. **Adjust scoring weights** (currently +2/-2 for patterns)
3. **Add more override cases** for edge cases
4. **Implement AI/ML** for more sophisticated classification

---

## Known Limitations

1. **Context matters**: Some keywords appear in both educational and distracting content
2. **False positives**: Gaming content might be educational (game dev) or distracting (gameplay)
3. **Language**: Only supports English keywords currently
4. **Coverage**: New trends and slang might not be covered

---

## Future Improvements

- [ ] Machine learning classification
- [ ] Video thumbnail analysis
- [ ] View count and engagement metrics
- [ ] Custom keyword lists per user
- [ ] Whitelist specific channels
- [ ] Multi-language support

