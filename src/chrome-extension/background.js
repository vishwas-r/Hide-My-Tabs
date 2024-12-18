var hiddenTabs = [];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "hide-tab",
    title: "Hide Tab",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "hide-tab") {
    hideTab(tab);
  }
});

function hideTab(tab) {
  return new Promise((resolve, reject) => {
    chrome.tabs.remove(tab.id, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      hiddenTabs.push({
        id: tab.id,
        title: tab.title,
        url: tab.url
      });
      saveHiddenTabs();
      resolve();
    });
  });
}

function unhideTab(tabId) {
  return new Promise((resolve, reject) => {
    var tabIndex = hiddenTabs.findIndex((t) => t.id === tabId);

    if (tabIndex !== -1) {
      var tab = hiddenTabs[tabIndex];
      chrome.tabs.create({ url: tab.url }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        hiddenTabs.splice(tabIndex, 1);
        saveHiddenTabs();
        resolve();
      });
    } else {
      reject(new Error("Tab not found"));
    }
  });
}

function hideAllTabs(customUrl) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: customUrl }, (newTab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        var tabsToHide = tabs.filter((tab) => !tab.pinned && tab.id !== newTab.id);
        var promises = tabsToHide.map((tab) => hideTab(tab));

        Promise.all(promises)
          .then(() => resolve(newTab))
          .catch(reject);
      });
    });
  });
}

function unhideAllTabs() {
  return new Promise((resolve, reject) => {
    var tabsToUnhide = [...hiddenTabs];
    var promises = tabsToUnhide.map((tab) => {
      return new Promise((resolveUnhide, rejectUnhide) => {
        chrome.tabs.create({ url: tab.url }, () => {
          if (chrome.runtime.lastError) {
            rejectUnhide(new Error(chrome.runtime.lastError.message));
            return;
          }

          hiddenTabs = hiddenTabs.filter((t) => t.id !== tab.id);
          saveHiddenTabs();
          resolveUnhide();
        });
      });
    });

    Promise.all(promises)
      .then(resolve)
      .catch(reject);
  });
}

function saveHiddenTabs() {
  chrome.storage.local.set({ hiddenTabs });
}

function loadHiddenTabs() {
  chrome.storage.local.get("hiddenTabs", (result) => {
    hiddenTabs = result.hiddenTabs || [];
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "hideAllTabs") {
    hideAllTabs(message.customUrl)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (message.action === "unhideAllTabs") {
    unhideAllTabs()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (message.action === "unhideTab") {
    unhideTab(message.tabId)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else {
    sendResponse({ success: false, error: "Unknown action" });
  }
});

loadHiddenTabs();