// YouTube Content Script
let focusMode = false;
let warningShown = false;
let currentVideoId = null;

// Load AI Classifier
let aiClassifier = null;
if (typeof AIVideoClassifier !== 'undefined') {
  aiClassifier = new AIVideoClassifier();
}

// Handle online/offline state changes
window.addEventListener('online', () => {
  console.log('🌐 Back online - re-analyzing video');
  if (focusMode) {
    analyzeCurrentVideo();
  }
});

window.addEventListener('offline', () => {
  console.log('📡 Gone offline - using conservative mode');
  if (focusMode) {
    showWarningPopup();
  }
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && focusMode) {
    console.log('🔄 Tab visible - refreshing state');
    analyzeCurrentVideo();
  }
});

// Handle tab focus
window.addEventListener('focus', () => {
  if (focusMode) {
    console.log('🔄 Tab focused - refreshing state');
    analyzeCurrentVideo();
  }
});

// Initialize
(async () => {
  try {
    // Check if extension is properly loaded
    if (!chrome || !chrome.runtime) {
      console.error('Chrome API not available - reloading content script');
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    // Get initial state
    const state = await chrome.storage.sync.get(['focusMode', 'settings']);
    focusMode = state.focusMode || false;
    
    // Initialize settings with defaults
    const settings = state.settings || {};
    window.purefocusSettings = {
      strictMode: settings.strictMode || false,
      allowedCategories: settings.allowedCategories || ['education', 'science'],
      autoRefreshInterval: settings.autoRefreshInterval || 30000 // 30 seconds
    };
    
    if (focusMode) {
      await initYouTubeFilter();
    }
    
    // Set up mutation observer for dynamic content
    observePageChanges();
  } catch (error) {
    console.error('Error initializing YouTube filter:', error);
  }
})();

// Observe page changes for dynamic content
function observePageChanges() {
  // Cleanup existing observers
  if (window.purefocusObservers) {
    window.purefocusObservers.forEach(observer => observer.disconnect());
  }
  window.purefocusObservers = [];

  // Observer for recommendations and comments
  const contentObserver = new MutationObserver((mutations) => {
    if (focusMode) {
      let hasRelevantChanges = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const hasNewContent = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            
            // Check for both old and new YouTube layouts
            return node.matches?.(
              '#secondary, #related, #comments, ytd-comments, ' +
              'ytd-watch-next-secondary-results-renderer, ' +
              'ytd-engagement-panel-section-list-renderer, ' +
              'ytd-reel-video-renderer, ytd-watch-flexy'
            ) || node.querySelector?.(
              '#secondary, #related, #comments, ytd-comments, ' +
              'ytd-watch-next-secondary-results-renderer, ' +
              'ytd-engagement-panel-section-list-renderer, ' +
              'ytd-reel-video-renderer'
            );
          });

          if (hasNewContent) {
            hasRelevantChanges = true;
          }
        }
      });

      // Batch updates to improve performance
      if (hasRelevantChanges) {
        requestAnimationFrame(() => {
          hideRecommendations();
          hideComments();
        });
      }
    }
  });

  // Observer for video changes
  const videoObserver = new MutationObserver((mutations) => {
    const videoIdChange = mutations.some(mutation => 
      mutation.target.matches?.('ytd-watch-flexy[video-id]') &&
      mutation.attributeName === 'video-id'
    );

    if (videoIdChange && focusMode) {
      const newVideoId = document.querySelector('ytd-watch-flexy').getAttribute('video-id');
      if (newVideoId && newVideoId !== window.purefocusCurrentVideoId) {
        window.purefocusCurrentVideoId = newVideoId;
        window.purefocusWarningShown = false;
        analyzeCurrentVideo();
      }
    }
  });

  // Start observing
  contentObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  videoObserver.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ['video-id']
  });

  window.purefocusObservers.push(contentObserver, videoObserver);
}

// Listen for settings and focus mode changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    // Handle focus mode changes
    if (changes.focusMode) {
      focusMode = changes.focusMode.newValue;
      console.log('🔄 Focus mode changed:', focusMode);
      
      if (focusMode) {
        initYouTubeFilter();
      } else {
        cleanupYouTubeFilter();
      }
    }
    
    // Handle settings changes
    if (changes.settings) {
      const newSettings = changes.settings.newValue || {};
      console.log('⚙️ Settings updated:', newSettings);
      
      window.purefocusSettings = {
        strictMode: newSettings.strictMode || false,
        allowedCategories: newSettings.allowedCategories || ['education', 'science'],
        autoRefreshInterval: newSettings.autoRefreshInterval || 30000
      };
      
      // Re-analyze current video with new settings if in focus mode
      if (focusMode) {
        analyzeCurrentVideo();
      }
    }
  }
});

function initYouTubeFilter() {
  if (focusMode) {
    console.log('🎯 Initializing YouTube filter - Focus Mode ON');
    
    // Hide recommendations immediately
    hideRecommendations();
    
    // Hide comments immediately
    hideComments();
    
    // Analyze current video
    analyzeCurrentVideo();
    
    // Monitor for video changes
    observeVideoChanges();
    
    // More aggressive periodic check for new recommendations
    // YouTube dynamically loads content, so we need to check frequently
    const hideInterval = setInterval(() => {
      if (focusMode) {
        hideRecommendations();
        hideComments();
      } else {
        clearInterval(hideInterval);
      }
    }, 1000); // Check every second for dynamically loaded content
    
    // Also use MutationObserver to hide new recommendations as they appear
    const recommendationObserver = new MutationObserver(() => {
      if (focusMode) {
        hideRecommendations();
        hideComments();
      }
    });
    
    // Observe the main content area for changes
    const mainContent = document.querySelector('#primary, #columns, #content');
    if (mainContent) {
      recommendationObserver.observe(mainContent, {
        childList: true,
        subtree: true
      });
    }
    
    // Store observer so we can disconnect it later
    window.focusflowRecommendationObserver = recommendationObserver;
  }
}

function cleanupYouTubeFilter() {
  console.log('🧹 Cleaning up YouTube filter - Focus Mode OFF');
  
  // Remove any injected styles/elements
  const warningPopup = document.getElementById('focusflow-warning');
  if (warningPopup) {
    warningPopup.remove();
  }
  
  // Remove injected styles
  const styles = document.getElementById('focusflow-styles');
  if (styles) {
    styles.remove();
  }
  
  // Disconnect observer if it exists
  if (window.focusflowRecommendationObserver) {
    window.focusflowRecommendationObserver.disconnect();
    window.focusflowRecommendationObserver = null;
  }
  
  // Show recommendations again
  showRecommendations();
  showComments();
  
  // Remove any dimming on video controls
  const controls = document.querySelector('.ytp-chrome-bottom');
  if (controls) {
    controls.style.opacity = '';
  }
  
  // Remove any video filters
  const video = document.querySelector('video');
  if (video) {
    video.style.filter = '';
  }
  
  // Force refresh the page layout
  window.dispatchEvent(new Event('resize'));
  
  console.log('✅ Cleanup complete - All elements restored');
}

function hideRecommendations() {
  try {
    // Add the class that enables CSS hiding
    document.body.classList.add('purefocus-active');
    
    // Hide end screen recommendations
    const endScreen = document.querySelector('.ytp-endscreen-content');
    if (endScreen) {
      endScreen.style.display = 'none';
      endScreen.dataset.purefocusDisabled = 'true';
    }
    
    // Additional dynamic elements that might need hiding
    const elementsToHide = document.querySelectorAll(`
      #secondary,
      #secondary-inner,
      #related,
      ytd-watch-next-secondary-results-renderer,
      ytd-compact-video-renderer,
      ytd-rich-item-renderer,
      ytd-video-renderer,
      ytd-playlist-video-renderer
    `);
    
    elementsToHide.forEach(element => {
      if (element.closest('#secondary, #related, #secondary-inner')) {
        element.style.display = 'none';
        element.dataset.purefocusDisabled = 'true';
      }
    });
    
    console.log('Hidden recommendations');
  } catch (error) {
    console.error('Error hiding recommendations:', error);
  }
}

function showRecommendations() {
  try {
    // Remove the class that hides recommendations
    document.body.classList.remove('purefocus-active');
    
    // Show all elements that were hidden
    const disabledElements = document.querySelectorAll('[data-purefocus-disabled]');
    disabledElements.forEach(element => {
      element.style.display = '';
      delete element.dataset.purefocusDisabled;
    });
    
    // Force layout recalculation for recommendations
    const secondary = document.querySelector('#secondary');
    if (secondary) {
      secondary.style.display = 'none';
      requestAnimationFrame(() => {
        secondary.style.display = '';
        // Force browser to recalculate layout
        secondary.getBoundingClientRect();
      });
    }
    
    // Ensure video player controls are restored
    const controls = document.querySelector('.ytp-chrome-bottom');
    if (controls) {
      controls.style.opacity = '';
      controls.style.pointerEvents = '';
    }
    
    console.log('Restored recommendations visibility');
  } catch (error) {
    console.error('Error showing recommendations:', error);
  }
}

function hideComments() {
  // Hide comments section (multiple selectors)
  const commentSelectors = [
    '#comments',
    '#comments #header',
    '#comments #contents',
    'ytd-comments#comments',
    '#sections ytd-comments',
    'ytd-item-section-renderer[target-id="watch-discussion"]',
    '#watch-discussion'
  ];
  
  commentSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
    }
  });
  
  // Also try to find and hide comment sections by class
  const commentSections = document.querySelectorAll('[class*="comment"], [id*="comment"]');
  commentSections.forEach(section => {
    if (section.closest('#comments') || section.closest('ytd-comments')) {
      section.style.display = 'none';
      section.style.visibility = 'hidden';
    }
  });
  
  console.log('Hidden comments section');
}

function showComments() {
  const comments = document.querySelector('#comments');
  if (comments) {
    comments.style.display = '';
  }
}

function observeVideoChanges() {
  // Also listen for URL changes (YouTube uses history API)
  let lastUrl = window.location.href;
  
  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      const videoId = getCurrentVideoId();
      if (videoId && videoId !== currentVideoId) {
        currentVideoId = videoId;
        warningShown = false;
        analyzeCurrentVideo();
      }
    }
  };
  
  // Check URL changes periodically
  setInterval(checkUrlChange, 1000);
  
  // Also listen for popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(checkUrlChange, 500);
  });
  
  // Monitor DOM changes for dynamic content
  const observer = new MutationObserver(() => {
    checkUrlChange();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function getCurrentVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

function analyzeCurrentVideo() {
  if (!focusMode) return;
  
  const videoId = getCurrentVideoId();
  if (!videoId) {
    warningShown = false;
    return;
  }

  // Add error handling for network state
  if (!navigator.onLine) {
    console.log('📡 Offline - showing warning');
    showWarningPopup();
    return;
  }
  
  console.log('📹 Analyzing video:', videoId);
  
  // Small delay to ensure page elements are loaded
  setTimeout(async () => {
    // Get video information
    const title = getVideoTitle();
    const description = getVideoDescription();
    const channel = getChannelName();
    
    console.log('Video info - Title:', title, 'Channel:', channel);
    
    // Skip if no title found (page might still be loading)
    if (!title) {
      console.log('⚠️ No title found, retrying...');
      // Retry after a longer delay
      setTimeout(() => analyzeCurrentVideo(), 1000);
      return;
    }
    
    // Classify video
    const isEducational = await classifyVideo(title, description, channel);
    
    console.log('📊 Classification result:', isEducational ? 'Educational ✅' : 'Distracting ⚠️');
    
    if (!isEducational && !warningShown) {
      console.log('🚨 Non-educational video detected - pausing and showing warning');
      
      // Pause the video immediately
      pauseVideo();
      
      // Show warning popup
      showWarningPopup();
      warningShown = true;
    } else if (isEducational) {
      console.log('✅ Educational video detected, no warning needed');
      // Ensure video can play if it was paused
      enableVideoPlayback();
    }
  }, 500);
}

// Function to pause the YouTube video
function pauseVideo() {
  const video = document.querySelector('video');
  if (video) {
    video.pause();
    console.log('⏸️ Video paused');
    
    // Also try to pause via YouTube's player API
    const playerButton = document.querySelector('.ytp-play-button[aria-label="Pause"]');
    if (!playerButton) {
      const playButton = document.querySelector('.ytp-play-button[aria-label="Play"]');
      if (playButton && !playButton.classList.contains('ytp-paused')) {
        // Video is playing, click to pause
        playButton.click();
      }
    }
  }
  
  // Hide video controls to prevent easy resume
  const controls = document.querySelector('.ytp-chrome-bottom');
  if (controls) {
    controls.style.opacity = '0.3';
  }
}

// Function to enable video playback (for educational videos)
function enableVideoPlayback() {
  const controls = document.querySelector('.ytp-chrome-bottom');
  if (controls) {
    controls.style.opacity = '1';
  }
}

function getVideoTitle() {
  const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1 yt-formatted-string');
  return titleElement ? titleElement.textContent.trim() : '';
}

function getVideoDescription() {
  const descriptionElement = document.querySelector('#description-text, ytd-expander #description');
  return descriptionElement ? descriptionElement.textContent.trim() : '';
}

function getChannelName() {
  const channelElement = document.querySelector('#channel-name a, ytd-channel-name a');
  return channelElement ? channelElement.textContent.trim() : '';
}

async function classifyVideo(title, description, channel) {
  // Handle offline state
  if (!navigator.onLine) {
    console.log('📡 Offline - using conservative classification');
    return false; // Be conservative when offline
  }

  // Try AI classifier first if available
  if (aiClassifier) {
    try {
      const aiResult = await aiClassifier.classifyVideo(title, description, channel);
      console.log('🤖 AI Classification:', {
        isEducational: aiResult.isEducational,
        confidence: (aiResult.confidence * 100).toFixed(1) + '%',
        reasoning: aiResult.reasoning
      });
      
      // Use AI result if confidence is high enough
      if (aiResult.confidence > 0.7) {
        return aiResult.isEducational;
      }
      
      // If AI is uncertain, fall back to keyword-based classification
      console.log('⚠️ AI confidence low, using keyword-based classification');
    } catch (error) {
      console.error('AI classifier error:', error);
      // Fall back to keyword-based
    }
  }
  
  // Fallback: Expanded Educational keywords
  const educationalKeywords = [
    // Learning and teaching
    'tutorial', 'lesson', 'course', 'learn', 'study', 'education', 'academic', 'teach',
    'lecture', 'how to', 'explain', 'concept', 'theory', 'guide', 'demonstration', 'walkthrough',
    
    // STEM subjects
    'physics', 'math', 'mathematics', 'chemistry', 'biology', 'science', 'engineering',
    'programming', 'coding', 'algorithm', 'data structure', 'software', 'development',
    'calculus', 'algebra', 'geometry', 'statistics', 'probability', 'linear algebra',
    'computer science', 'machine learning', 'artificial intelligence', 'python', 'java',
    'javascript', 'c++', 'c#', 'react', 'angular', 'vue', 'node', 'database', 'sql',
    
    // Academic subjects
    'history', 'literature', 'philosophy', 'psychology', 'sociology', 'economics',
    'political science', 'geography', 'geology', 'astronomy', 'anatomy',
    
    // Research and analysis
    'research', 'analysis', 'documentary', 'case study', 'experiment', 'methodology',
    
    // Educational platforms and institutions
    'khan academy', 'coursera', 'edx', 'udemy', 'mit', 'harvard', 'stanford', 'cambridge',
    'oxford', 'college', 'university', 'school', 'class', 'curriculum', 'syllabus',
    
    // Skill building
    'skill', 'workshop', 'seminar', 'webinar', 'masterclass', 'certification',
    'professional development', 'career development', 'skill building',
    
    // Educational formats
    'full course', 'complete tutorial', 'step by step', 'beginner', 'intermediate', 'advanced',
    'fundamentals', 'basics', 'principles', 'foundations', 'introduction',
    
    // Language and culture
    'language learning', 'grammar', 'vocabulary', 'pronunciation', 'culture', 'civilization',
    
    // Technical training
    'technical', 'professional', 'industry standard', 'best practices', 'design patterns',
    'architecture', 'system design', 'devops', 'security', 'networking',
    
    // Game development
    'game development', 'unity', 'unreal engine', 'godot', 'game design', 'gamedev',
    'game engine', 'game programming', 'game creation',
    
    // Problem solving
    'problem solving', 'algorithm', 'coding challenge', 'leetcode', 'hackerrank',
    'technical interview', 'code review'
  ];
  
  // Expanded Distracting keywords
  const distractingKeywords = [
    // Entertainment
    'meme', 'funny', 'hilarious', 'laugh', 'comedy', 'joke', 'prank', 'challenge',
    'entertainment', 'fun', 'cool', 'awesome', 'amazing', 'wtf', 'lol', 'crazy',
    
    // Gaming (non-educational) - but NOT game development tutorials
    'gameplay', 'let\'s play', 'speedrun', 'epic', 'montage', 'highlights',
    'walkthrough', 'gaming moment', 'gaming fails', 'twitch stream', 'livestream', 'e-sports',
    'game review', 'first impressions', 'comparison',
    
    // Social media content
    'tiktok', 'shorts', 'reels', 'viral', 'trending', 'fyp', 'subscribe for more',
    'react', 'reaction', 'reacting', 'review reaction', 'first time watching',
    
    // Music and dance
    'music video', 'mv', 'song', 'dance', 'choreography', 'tiktok dance', 'music',
    'mashup', 'remix', 'beats', 'instrumental', 'concert',
    
    // Lifestyle and personal
    'vlog', 'daily vlog', 'morning routine', 'night routine', 'lifestyle', 'day in my life',
    'unboxing', 'haul', 'clothing haul', 'shopping', 'try on haul', 'review', 'getting ready',
    
    // Beauty and fashion (non-educational)
    'makeup', 'beauty routine', 'beauty',
    'skincare routine', 'hair tutorial', 'nail art', 'fashion', 'outfit', 'style',
    
    // Food (non-educational)
    'food', 'cooking', 'recipe', 'mukbang', 'eating', 'chef', 'restaurant review',
    'fast food', 'wow this is delicious',
    
    // Travel (non-educational)
    'vacation', 'travel vlog', 'beach', 'hotel tour', 'resort',
    
    // Pranks and challenges
    'prank', 'challenge', '24 hour challenge', 'extreme challenge', 'dare',
    'social experiment', 'would you rather', 'truth or dare',
    
    // Reactions and compilations
    'compilation', 'best moments', 'fails', 'win', 'try not to laugh', 'try not to cry',
    'satisfying', 'oddly satisfying', 'relaxing', 'satisfying video',
    
    // Celebrities and gossip
    'celebrity', 'gossip', 'tea', 'drama', 'reddit', 'storytime',
    
    // NSFW related (family friendly)
    'clickbait', 'exposed', 'truth', 'hacked', 'jumped', 'caught',
    
    // Pet and animal videos (non-educational)
    'cute', 'adorable', 'puppy', 'kitten', 'animal compilation', 'funny animals',
    
    // Gaming montages
    'epic montage', 'win compilation', 'kills compilation', 'best plays',
    
    // Passive consumption
    'watch until the end', 'surprise', 'shocking', 'you won\'t believe',
    'top 10', 'top 5', 'ranking', 'list', 'countdown'
  ];
  
  const text = `${title} ${description} ${channel}`.toLowerCase();
  
  // Count matches with case-insensitive search
  const educationalMatches = educationalKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length;
  
  const distractingMatches = distractingKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length;
  
  console.log(`📊 Keyword counts - Educational: ${educationalMatches}, Distracting: ${distractingMatches}`);
  
  // Check for known educational channels
  const isKnownEducationalChannel = /(khan academy|coursera|edx|udemy|mit|stanford|harvard|cambridge|oxford|udacity|pluralsight|lynda|codecademy)/i.test(channel);
  
  // Check for known educational patterns in title
  const hasEducationalPattern = /\b(tutorial|course|lecture|lesson|how to|guide|explained|fundamentals|basics|introduction|learn|study)\b/i.test(title);
  
  // Check for distracting patterns
  const hasDistractingPattern = /\b(meme|funny|prank|challenge|compilation|reaction|vlog|gameplay|montage|shorts|tiktok)\b/i.test(title);
  
  // Calculate score
  let score = educationalMatches - distractingMatches;
  
  // Adjust score based on patterns
  if (hasEducationalPattern && !hasDistractingPattern) {
    score += 2;
  }
  if (hasDistractingPattern && !hasEducationalPattern) {
    score -= 2;
  }
  
  // Special handling for known educational channels
  if (isKnownEducationalChannel) {
    score += 3;
  }
  
  console.log(`📈 Final score: ${score} (Educational pattern: ${hasEducationalPattern}, Distracting pattern: ${hasDistractingPattern}, Known channel: ${isKnownEducationalChannel})`);
  
  // Classify as educational if score is positive or if it has strong educational signals
  let isEducational = score > 0 || (educationalMatches >= 2 && distractingMatches === 0);
  
  // Special case: If title has strong educational keywords, override distracting keywords
  if (hasEducationalPattern && educationalMatches >= 3) {
    isEducational = true;
    console.log('✅ Override: Strong educational pattern detected');
  }
  
  // Special case: Programming/coding content is usually educational if not purely entertainment
  const hasProgrammingKeywords = /\b(programming|coding|code|developer|development|software|computer science|tech|technology|technical)\b/i.test(text);
  const isTechChannel = /\b(developer|coding|tech|programming|software|academy|university|college)\b/i.test(channel.toLowerCase());
  
  if (hasProgrammingKeywords && !hasDistractingPattern && educationalMatches > 0) {
    isEducational = true;
    console.log('✅ Override: Educational tech content detected');
  }
  
  // Special case: Remove false positives for educational gaming content
  if (/\b(game development|game dev|unity tutorial|unreal tutorial|how to make a game)\b/i.test(text)) {
    isEducational = true;
    console.log('✅ Override: Game development tutorial detected');
  }
  
  return isEducational;
}

function showWarningPopup() {
  // Remove existing popup if any
  const existing = document.getElementById('focusflow-warning');
  if (existing) {
    existing.remove();
  }
  
  // Keep video paused
  pauseVideo();
  
  // Add styles if they don't exist
  if (!document.getElementById('focusflow-styles')) {
    const styles = document.createElement('style');
    styles.id = 'focusflow-styles';
    styles.textContent = `
      .focusflow-warning {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999999;
        animation: focusflowFadeIn 0.3s ease-out;
      }
      
      @keyframes focusflowFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .focusflow-warning-content {
        background: white;
        padding: 24px;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: focusflowSlideIn 0.3s ease-out;
      }
      
      @keyframes focusflowSlideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .focusflow-warning-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .focusflow-warning-title {
        font-size: 24px;
        font-weight: bold;
        color: #1a1a1a;
        margin-bottom: 8px;
      }
      
      .focusflow-warning-message {
        font-size: 16px;
        color: #666;
        margin-bottom: 24px;
        line-height: 1.4;
      }
      
      .focusflow-warning-buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
      }
      
      .focusflow-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        outline: none;
      }
      
      .focusflow-btn:hover {
        transform: translateY(-1px);
      }
      
      .focusflow-btn:active {
        transform: translateY(0);
      }
      
      .focusflow-btn-primary {
        background: #3369e7;
        color: white;
        box-shadow: 0 2px 4px rgba(51, 105, 231, 0.2);
      }
      
      .focusflow-btn-primary:hover {
        background: #2857d6;
        box-shadow: 0 4px 8px rgba(51, 105, 231, 0.3);
      }
      
      .focusflow-btn-secondary {
        background: #f0f0f0;
        color: #666;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .focusflow-btn-secondary:hover {
        background: #e4e4e4;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(styles);
  }
  
  const popup = document.createElement('div');
  popup.id = 'focusflow-warning';
  popup.className = 'focusflow-warning';
  popup.innerHTML = `
    <div class="focusflow-warning-content">
      <div class="focusflow-warning-icon">⚠️</div>
      <div class="focusflow-warning-text">
        <div class="focusflow-warning-title">Stay Focused?</div>
        <div class="focusflow-warning-message">This video may distract you from your study goals. Want to stay on track?</div>
      </div>
      <div class="focusflow-warning-buttons">
        <button class="focusflow-btn focusflow-btn-primary" id="focusflow-stay-focused">Keep Studying</button>
        <button class="focusflow-btn focusflow-btn-secondary" id="focusflow-continue">Watch Anyway</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Prevent video from playing while popup is shown
  const preventPlayback = setInterval(() => {
    pauseVideo();
  }, 500);
  
  // Button handlers
  document.getElementById('focusflow-stay-focused').addEventListener('click', () => {
    clearInterval(preventPlayback);
    popup.remove();
    
    // Navigate away from the video
    console.log('🔙 Navigating away from non-educational video');
    
    // Try multiple methods to navigate away
    const backButton = document.querySelector('button[aria-label="Back"], button[aria-label*="Back"]');
    if (backButton) {
      backButton.click();
    } else {
      // Navigate to YouTube home
      window.location.href = 'https://www.youtube.com';
    }
    
    warningShown = true;
  });
  
  document.getElementById('focusflow-continue').addEventListener('click', () => {
    clearInterval(preventPlayback);
    popup.remove();
    
    // Allow video to play, but keep blocking other distracting content
    console.log('▶️ User chose to continue with non-educational video');
    
    const video = document.querySelector('video');
    if (video) {
      video.play().catch(e => {
        console.log('Could not auto-play video:', e);
      });
    }
    
    // Restore controls visibility
    enableVideoPlayback();
    
    warningShown = true; // Don't show again for this video
  });
  
  // Auto-remove and navigate away after 15 seconds if user doesn't respond
  setTimeout(() => {
    if (document.body.contains(popup)) {
      clearInterval(preventPlayback);
      popup.remove();
      console.log('⏱️ Auto-navigating away after timeout');
      
      // Navigate to YouTube home
      window.location.href = 'https://www.youtube.com';
      warningShown = true;
    }
  }, 15000); // 15 seconds
}

