document.addEventListener("DOMContentLoaded", function () {
  browser.storage.local.get("customUrl").then(result => {
    var customUrlInput = document.getElementById("customUrl");
    customUrlInput.value = result.customUrl || '';
  });

  loadHiddenTabs();

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.hiddenTabs) {
      loadHiddenTabs();
    }
  });

  document.getElementById("saveUrlBtn").addEventListener("click", () => {
    var customUrl = document.getElementById("customUrl").value;
    browser.storage.local.set({ customUrl: customUrl });
  });
});

function loadHiddenTabs() {
  browser.storage.local.get("hiddenTabs").then(result => {
    var hiddenTabs = result.hiddenTabs || [];
    var hiddenTabsList = document.getElementById("hiddenTabsList");
    var noTabsMessage = document.getElementById("noTabsMessage");

    hiddenTabsList.innerHTML = '';

    if (hiddenTabs.length === 0) {
      noTabsMessage.style.display = 'block';
      hiddenTabsList.style.display = 'none';
    } else {
      noTabsMessage.style.display = 'none';
      hiddenTabsList.style.display = 'table';

      hiddenTabs.forEach(tab => {
        var row = document.createElement("tr");

        var titleCell = document.createElement("td");
        titleCell.textContent = tab.title;
        row.appendChild(titleCell);

        var actionCell = document.createElement("td");

        var unhideButton = document.createElement("button");
        unhideButton.textContent = "Unhide";
        unhideButton.classList.add("unhide");
        unhideButton.addEventListener("click", () => {
          unhideTab(tab.id);
        });
        actionCell.appendChild(unhideButton);

        var removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.classList.add("remove");
        removeButton.addEventListener("click", () => {
          removeTab(tab.id);
        });
        actionCell.appendChild(removeButton);

        row.appendChild(actionCell);
        hiddenTabsList.appendChild(row);
      });
    }
  });
}

document.getElementById("hideAllTabsBtn").addEventListener("click", () => {
  browser.storage.local.get("customUrl").then(result => {
    var customUrl = result.customUrl || "https://www.google.com";
    browser.runtime.sendMessage({ action: "hideAllTabs", customUrl: customUrl }).then(() => {
      loadHiddenTabs();
    });
  });
});

document.getElementById("unhideAllTabsBtn").addEventListener("click", () => {
  browser.runtime.sendMessage({ action: "unhideAllTabs" }).then(() => {
    var hiddenTabsList = document.getElementById("hiddenTabsList");
    hiddenTabsList.innerHTML = '';
    loadHiddenTabs();
  });
});

function unhideTab(tabId) {
  browser.storage.local.get("hiddenTabs").then(result => {
    var hiddenTabs = result.hiddenTabs || [];
    var tabIndex = hiddenTabs.findIndex(tab => tab.id === tabId);
    if (tabIndex !== -1) {
      var tab = hiddenTabs.splice(tabIndex, 1)[0];

      tab.state = "shwown";

      browser.storage.local.set({ hiddenTabs }).then(() => {
        browser.runtime.sendMessage({ action: "unhideTab", tabId: tab.id }).then(() => {
          loadHiddenTabs();
        });
      });
    }
  });
}

function removeTab(tabId) {
  browser.storage.local.get("hiddenTabs").then(result => {
    var hiddenTabs = result.hiddenTabs || [];
    var tabIndex = hiddenTabs.findIndex(tab => tab.id === tabId);

    if (tabIndex !== -1) {
      hiddenTabs.splice(tabIndex, 1);

      browser.storage.local.set({ hiddenTabs }).then(() => {
        loadHiddenTabs();
      });
    }
  });
}