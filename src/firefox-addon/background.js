let hiddenTabs = [];
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "hide-tab",
    title: "Hide Tab",
    contexts: ["tab"]
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "hide-tab") {
    hideTab(tab);
  }
});

function hideTab(tab) {
  browser.tabs.remove(tab.id).then(() => {
    hiddenTabs.push({
      id: tab.id,
      title: tab.title,
      url: tab.url
    });
    saveHiddenTabs();
  });
}

function unhideTab(tabId) {
  const tabIndex = hiddenTabs.findIndex((t) => t.id === tabId);

  if (tabIndex !== -1) {
    const tab = hiddenTabs[tabIndex];
    browser.tabs.create({ url: tab.url }).then(() => {
      hiddenTabs.splice(tabIndex, 1);
      saveHiddenTabs();
    });
  }
}

function hideAllTabs(customUrl) {
  browser.tabs.query({}).then((tabs) => {
    const tabsToHide = tabs.filter((tab) => !tab.pinned);
    tabsToHide.forEach((tab) => {
      hideTab(tab);
    });
    browser.tabs.create({ url: customUrl });
  });
}

function unhideAllTabs() {
  const tabsToUnhide = [...hiddenTabs];
  tabsToUnhide.forEach((tab) => {
    browser.tabs.create({ url: tab.url }).then(() => {
      hiddenTabs = hiddenTabs.filter((t) => t.id !== tab.id);
      saveHiddenTabs();
    });
  });
}

function saveHiddenTabs() {
  browser.storage.local.set({ hiddenTabs });
}

function loadHiddenTabs() {
  return browser.storage.local.get("hiddenTabs").then((result) => {
    hiddenTabs = result.hiddenTabs || [];
  });
}

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "hideAllTabs") {
    hideAllTabs(message.customUrl);
  } else if (message.action === "unhideAllTabs") {
    unhideAllTabs();
  } else if (message.action === "unhideTab") {
    unhideTab(message.tabId);
  }
});

loadHiddenTabs();