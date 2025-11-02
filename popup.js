// Popup UI Logic
document.addEventListener('DOMContentLoaded', async () => {
  const focusToggle = document.getElementById('focusToggle');
  const statusText = document.getElementById('statusText');
  const todayTime = document.getElementById('todayTime');
  const weekTime = document.getElementById('weekTime');
  const siteList = document.getElementById('siteList');
  const editPanel = document.getElementById('editPanel');
  const editSitesBtn = document.getElementById('editSitesBtn');
  const newSiteInput = document.getElementById('newSiteInput');
  const addSiteBtn = document.getElementById('addSiteBtn');
  
  // Settings elements
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const autoFocusTime = document.getElementById('autoFocusTime');
  const customScheduleSettings = document.getElementById('customScheduleSettings');
  const scheduleStart = document.getElementById('scheduleStart');
  const scheduleEnd = document.getElementById('scheduleEnd');
  const allowedCategories = document.getElementsByName('allowedCategory');

  // Load current state
  const state = await chrome.storage.sync.get(['focusMode', 'blockedSites', 'analytics']);
  const focusMode = state.focusMode || false;
  const blockedSites = state.blockedSites || [
    'instagram.com',
    'reddit.com',
    'netflix.com',
    'twitter.com',
    'facebook.com'
  ];
  const analytics = state.analytics || { daily: 0, weekly: 0, lastReset: Date.now() };

  // Initialize UI
  focusToggle.checked = focusMode;
  updateStatusText(focusMode);
  updateStats(analytics);
  renderSiteList(blockedSites);

  // Focus Mode Toggle
  focusToggle.addEventListener('change', async (e) => {
    const newMode = e.target.checked;
    await chrome.storage.sync.set({ focusMode: newMode });
    updateStatusText(newMode);
    
    // Notify background script
    chrome.runtime.sendMessage({ action: 'focusModeChanged', enabled: newMode });
    
    // Reload current tab to apply changes
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url) {
      chrome.tabs.reload(tab.id);
    }
  });

  // Edit Sites Toggle
  editSitesBtn.addEventListener('click', () => {
    const isVisible = editPanel.style.display !== 'none';
    editPanel.style.display = isVisible ? 'none' : 'block';
    editSitesBtn.classList.toggle('active');
    renderSiteList(blockedSites, !isVisible);
  });

  // Add Site
  addSiteBtn.addEventListener('click', async () => {
    const site = newSiteInput.value.trim().toLowerCase();
    if (site && !blockedSites.includes(site)) {
      blockedSites.push(site);
      await chrome.storage.sync.set({ blockedSites });
      renderSiteList(blockedSites, editPanel.style.display !== 'none');
      newSiteInput.value = '';
      chrome.runtime.sendMessage({ action: 'blockedSitesUpdated' });
    }
  });

  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSiteBtn.click();
    }
  });

  function renderSiteList(sites, isEditing = false) {
    siteList.innerHTML = '';
    sites.forEach(site => {
      const tag = document.createElement('div');
      tag.className = 'site-tag';
      
      const siteText = document.createElement('span');
      siteText.textContent = site;
      tag.appendChild(siteText);

      if (isEditing) {
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove';
        removeBtn.textContent = '✕';
        removeBtn.title = 'Remove site';
        removeBtn.addEventListener('click', async () => {
          const index = blockedSites.indexOf(site);
          if (index > -1) {
            blockedSites.splice(index, 1);
            await chrome.storage.sync.set({ blockedSites });
            renderSiteList(blockedSites, true);
            renderEditSiteList(blockedSites);
            chrome.runtime.sendMessage({ action: 'blockedSitesUpdated' });
          }
        });
        tag.appendChild(removeBtn);
      }
      
      siteList.appendChild(tag);
    });
  }



  function updateStatusText(isActive) {
    statusText.textContent = isActive ? 'Active' : 'Off';
    statusText.className = isActive ? 'status-text active' : 'status-text';
  }

  function updateStats(analytics) {
    const todayMinutes = Math.floor((analytics.daily || 0) / 60);
    const weekMinutes = Math.floor((analytics.weekly || 0) / 60);
    
    todayTime.textContent = `${todayMinutes}m`;
    weekTime.textContent = `${weekMinutes}m`;
  }

  // Settings Modal
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadSettings();
  });

  closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  // Prevent modal close when clicking modal content
  document.querySelector('.modal-content').addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Auto Focus Schedule
  autoFocusTime.addEventListener('change', async () => {
    const value = autoFocusTime.value;
    customScheduleSettings.style.display = value === 'custom' ? 'block' : 'none';
    await saveSettings();
  });

  // Time inputs
  scheduleStart.addEventListener('change', saveSettings);
  scheduleEnd.addEventListener('change', saveSettings);

  // Category checkboxes
  allowedCategories.forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });

  // Toggle switches
  ['notifyDistraction', 'dailyReport', 'strictMode', 'collectAnalytics'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', saveSettings);
    }
  });

  // Export Data
  document.getElementById('exportData').addEventListener('click', async () => {
    const data = await chrome.storage.sync.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purefocus-data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  async function loadSettings() {
    const settings = await chrome.storage.sync.get({
      autoFocusTime: '',
      scheduleStart: '09:00',
      scheduleEnd: '17:00',
      notifyDistraction: true,
      dailyReport: false,
      strictMode: false,
      allowedCategories: ['education', 'science'],
      collectAnalytics: true
    });

    // Apply settings to form
    autoFocusTime.value = settings.autoFocusTime;
    customScheduleSettings.style.display = settings.autoFocusTime === 'custom' ? 'block' : 'none';
    scheduleStart.value = settings.scheduleStart;
    scheduleEnd.value = settings.scheduleEnd;

    // Set toggle switches
    document.getElementById('notifyDistraction').checked = settings.notifyDistraction;
    document.getElementById('dailyReport').checked = settings.dailyReport;
    document.getElementById('strictMode').checked = settings.strictMode;
    document.getElementById('collectAnalytics').checked = settings.collectAnalytics;

    // Set category checkboxes
    allowedCategories.forEach(checkbox => {
      checkbox.checked = settings.allowedCategories.includes(checkbox.value);
    });
  }

  async function saveSettings() {
    const settings = {
      autoFocusTime: autoFocusTime.value,
      scheduleStart: scheduleStart.value,
      scheduleEnd: scheduleEnd.value,
      notifyDistraction: document.getElementById('notifyDistraction').checked,
      dailyReport: document.getElementById('dailyReport').checked,
      strictMode: document.getElementById('strictMode').checked,
      allowedCategories: Array.from(allowedCategories)
        .filter(cb => cb.checked)
        .map(cb => cb.value),
      collectAnalytics: document.getElementById('collectAnalytics').checked
    };

    await chrome.storage.sync.set(settings);
    chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });
  }

  // Listen for real-time updates
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.focusMode) {
        focusToggle.checked = changes.focusMode.newValue;
        updateStatusText(changes.focusMode.newValue);
      }
      if (changes.analytics) {
        updateStats(changes.analytics.newValue);
      }
    }
  });
});

