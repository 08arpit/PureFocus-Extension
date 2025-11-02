// Background Service Worker
let blockedSites = [];
let focusMode = false;
let focusStartTime = null;
let dailyFocusTime = 0;
let weeklyFocusTime = 0;
let lastReset = Date.now();

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  const state = await chrome.storage.sync.get(['focusMode', 'blockedSites', 'analytics']);
  
  focusMode = state.focusMode || false;
  blockedSites = state.blockedSites || [
    'instagram.com',
    'reddit.com',
    'netflix.com',
    'twitter.com',
    'facebook.com'
  ];
  
  if (state.analytics) {
    dailyFocusTime = state.analytics.daily || 0;
    weeklyFocusTime = state.analytics.weekly || 0;
    lastReset = state.analytics.lastReset || Date.now();
  }

  setupWebRequestListener();
  startFocusTracking();
});

// Initialize on startup (in case service worker was inactive)
async function initialize() {
  const state = await chrome.storage.sync.get(['focusMode', 'blockedSites', 'analytics']);
  
  focusMode = state.focusMode || false;
  blockedSites = state.blockedSites || [
    'instagram.com',
    'reddit.com',
    'netflix.com',
    'twitter.com',
    'facebook.com'
  ];
  
  // Save default blocked sites if they don't exist
  if (!state.blockedSites) {
    await chrome.storage.sync.set({ blockedSites });
  }
  
  if (state.analytics) {
    dailyFocusTime = state.analytics.daily || 0;
    weeklyFocusTime = state.analytics.weekly || 0;
    lastReset = state.analytics.lastReset || Date.now();
  } else {
    // Initialize analytics if not present
    await chrome.storage.sync.set({
      analytics: {
        daily: 0,
        weekly: 0,
        lastReset: Date.now()
      }
    });
  }

  console.log('Initializing FocusFlow. Focus Mode:', focusMode, 'Blocked Sites:', blockedSites);
  setupWebRequestListener();
  startFocusTracking();
  
  if (focusMode) {
    focusStartTime = Date.now();
  }
}

initialize();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.focusMode) {
      focusMode = changes.focusMode.newValue;
      if (focusMode) {
        focusStartTime = Date.now();
      } else {
        updateFocusTime();
      }
      setupWebRequestListener(); // Update web request listener when focus mode changes
    }
    if (changes.blockedSites) {
      blockedSites = changes.blockedSites.newValue || [];
      setupWebRequestListener();
    }
  }
});

// Web Request Listener for site blocking
let currentListener = null;

function setupWebRequestListener() {
  // Remove existing listener if any
  if (currentListener) {
    try {
      chrome.webRequest.onBeforeRequest.removeListener(currentListener);
    } catch (e) {
      console.log('Error removing listener:', e);
    }
    currentListener = null;
  }
  
  if (focusMode && blockedSites.length > 0) {
    // Normalize and validate blocked sites
    const normalizedSites = blockedSites
      .map(site => site.trim().toLowerCase())
      .filter(site => {
        // Basic URL validation
        if (!site) return false;
        if (site.includes('://')) return false; // Don't allow full URLs
        if (site.includes('/')) return false; // Don't allow paths
        return true;
      })
      .map(site => site.replace(/^www\./, '')); // Remove www. prefix
    
    // Create comprehensive URL patterns for each blocked site
    const urlPatterns = normalizedSites.flatMap(site => {
      // Basic patterns for direct matches
      const patterns = [
        `*://${site}/*`,
        `*://www.${site}/*`
      ];
      
      // Add subdomain wildcards for main domains
      if (site.split('.').length === 2) {
        patterns.push(`*://*.${site}/*`);
      }
      
      // Specific protocol variants
      patterns.push(
        `http://${site}/*`,
        `https://${site}/*`,
        `http://www.${site}/*`,
        `https://www.${site}/*`
      );
      
      return patterns;
    });
    
    // Remove duplicates and invalid patterns
    const uniquePatterns = [...new Set(urlPatterns)].filter(pattern => {
      try {
        // Basic pattern validation
        return pattern.includes('*://') && pattern.endsWith('/*');
      } catch (e) {
        console.error('Invalid URL pattern:', pattern, e);
        return false;
      }
    });
    
    console.log('Setting up webRequest listener for:', uniquePatterns);
    console.log('Focus Mode:', focusMode, 'Blocked Sites:', normalizedSites);
    
    // Create the listener function with improved matching
    currentListener = (details) => {
      try {
        const url = new URL(details.url);
        const hostname = url.hostname.toLowerCase();
        
        // Skip blocking for extension resources
        if (details.url.startsWith('chrome-extension://')) {
          return {};
        }
        
        // Check if this site should be blocked
        const shouldBlock = normalizedSites.some(site => {
          // Exact domain match
          if (hostname === site) return true;
          
          // www subdomain match
          if (hostname === `www.${site}`) return true;
          
          // Subdomain match for main domains
          if (site.split('.').length === 2 && hostname.endsWith(`.${site}`)) return true;
          
          return false;
        });
        
        if (shouldBlock && focusMode) {
          console.log('🚫 Blocking request to:', hostname);
          
          // Get the matched site for the blocking page
          const matchedSite = normalizedSites.find(site => 
            hostname === site || 
            hostname === `www.${site}` || 
            hostname.endsWith(`.${site}`)
          );
          
          // If it's a main frame request, redirect to blocking page
          if (details.type === 'main_frame') {
            return {
              redirectUrl: chrome.runtime.getURL(
                `blocked.html?site=${encodeURIComponent(matchedSite || hostname)}`
              )
            };
          }
          
          // Block other requests
          return { cancel: true };
        }
        
        return {}; // Allow the request
      } catch (error) {
        console.error('Error in request listener:', error);
        return {}; // Allow on error
      }
    };
    
    try {
      chrome.webRequest.onBeforeRequest.addListener(
        currentListener,
        { 
          urls: uniquePatterns,
          types: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other']
        },
        ['blocking']
      );
      console.log('✅ WebRequest listener added successfully');
    } catch (error) {
      console.error('❌ Error adding webRequest listener:', error);
      currentListener = null;
      
      // Fallback to basic tab blocking
      console.log('Falling back to basic tab blocking');
    }
  } else {
    console.log('WebRequest listener not active. Focus Mode:', focusMode, 'Blocked Sites:', blockedSites.length);
  }
}

function blockRequest(details) {
  // Legacy function - not used, but kept for compatibility
  console.log('Legacy blockRequest called for:', details.url);
  if (focusMode) {
    return { cancel: true };
  }
}

// Focus time tracking
let trackingInterval = null;
let lastSaveTime = Date.now();

function startFocusTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  
  trackingInterval = setInterval(async () => {
    if (focusMode && focusStartTime) {
      const now = Date.now();
      
      // Check and handle day change
      const currentDay = new Date().toLocaleDateString();
      const resetDay = new Date(lastReset).toLocaleDateString();
      
      if (currentDay !== resetDay) {
        console.log('New day detected, resetting daily stats');
        dailyFocusTime = 0;
        
        // Check for week change
        const currentWeekNumber = getWeekNumber(new Date());
        const lastWeekNumber = getWeekNumber(new Date(lastReset));
        
        if (currentWeekNumber !== lastWeekNumber) {
          console.log('New week detected, resetting weekly stats');
          weeklyFocusTime = 0;
        }
        
        lastReset = now;
      }
      
      // Calculate actual elapsed time since last update
      const elapsed = Math.floor((now - lastSaveTime) / 1000);
      if (elapsed > 0) {
        dailyFocusTime = (dailyFocusTime || 0) + elapsed;
        weeklyFocusTime = (weeklyFocusTime || 0) + elapsed;
        
        // Save to storage every minute or when accumulated time is significant
        if (now - lastSaveTime >= 60000 || elapsed > 60) {
          console.log('Saving focus time - Daily:', dailyFocusTime, 'Weekly:', weeklyFocusTime);
          try {
            await chrome.storage.sync.set({
              analytics: {
                daily: dailyFocusTime,
                weekly: weeklyFocusTime,
                lastReset
              }
            });
            lastSaveTime = now;
          } catch (error) {
            console.error('Error saving analytics:', error);
          }
        }
      }
    }
  }, 1000); // Update every second
}

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function updateFocusTime() {
  // This function is called when focus mode changes
  // The actual tracking is done in the interval
  if (!focusMode) {
    focusStartTime = null;
  } else if (!focusStartTime) {
    focusStartTime = Date.now();
  }
}

// Tab navigation blocking (fallback method)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && focusMode && blockedSites.length > 0 && tab.url) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname.toLowerCase();
      
      const shouldBlock = blockedSites.some(site => {
        const cleanSite = site.replace(/^www\./, '').toLowerCase();
        return hostname === cleanSite || 
               hostname === `www.${cleanSite}` ||
               hostname.endsWith(`.${cleanSite}`);
      });
      
      if (shouldBlock) {
        console.log('🚫 Blocking tab navigation to:', tab.url);
        // Get blocked site name for display
        const blockedSite = blockedSites.find(site => {
          const cleanSite = site.replace(/^www\./, '').toLowerCase();
          return hostname === cleanSite || hostname === `www.${cleanSite}` || hostname.endsWith(`.${cleanSite}`);
        }) || hostname;
        
        // Redirect to blocking page
        chrome.tabs.update(tabId, { 
          url: chrome.runtime.getURL(`blocked.html?site=${encodeURIComponent(blockedSite)}`)
        });
      }
    } catch (e) {
      // Invalid URL, ignore
      console.log('Error blocking tab:', e);
    }
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'focusModeChanged') {
    focusMode = message.enabled;
    console.log('Focus mode changed to:', focusMode);
    if (focusMode) {
      focusStartTime = Date.now();
    } else {
      updateFocusTime();
    }
    setupWebRequestListener();
    sendResponse({ success: true });
  } else if (message.action === 'blockedSitesUpdated') {
    chrome.storage.sync.get(['blockedSites']).then(state => {
      blockedSites = state.blockedSites || [];
      console.log('Blocked sites updated:', blockedSites);
      setupWebRequestListener();
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  } else if (message.action === 'checkFocusMode') {
    sendResponse({ focusMode, blockedSites });
  } else if (message.action === 'getBlockedSites') {
    sendResponse({ blockedSites });
  } else if (message.action === 'refreshBlocking') {
    // Force refresh blocking setup
    chrome.storage.sync.get(['focusMode', 'blockedSites']).then(state => {
      focusMode = state.focusMode || false;
      blockedSites = state.blockedSites || [];
      console.log('Refreshing blocking. Focus Mode:', focusMode, 'Sites:', blockedSites);
      setupWebRequestListener();
      sendResponse({ success: true, focusMode, blockedSites });
    });
    return true;
  }
  return true; // Keep channel open for async responses
});

