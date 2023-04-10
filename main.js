chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "get-info") {
    const editingInfo = document.querySelector("#editingInfo");
    if (editingInfo) {
      const eid = getEidFromEditingInfo(editingInfo);
      const currentUser = getCurrentUser(eid);
      const user = editingInfo.innerHTML.replace(/by.*/, `by ${currentUser}`);
      chrome.runtime.sendMessage({ user });
    }
    const userPresenceDialog = document.querySelector("#userPresenceDialog");
    if (userPresenceDialog) {
      const users = userPresenceDialog.querySelectorAll(
        "div > div > div > div > span"
      );
      const data = JSON.parse(localStorage.getItem("data"));
      users.forEach((user) => {
        const eid = user.innerHTML;
        const findName = data.find((item) => item.eid === eid);
        if (findName) {
          user.innerHTML = `${eid} (${findName.name})`;
        }
      });
    }
  }
});

function getEidFromEditingInfo(editingInfo) {
  return editingInfo.innerHTML.split("by")[1].slice(0, -1).trim();
}

function getCurrentUser(eid) {
  const you = document.querySelector(
    "#common-header > div.dbac--main > header > div > div > nav > ul > li > button > div > span"
  )?.innerHTML;
  const data = JSON.parse(localStorage.getItem("data"));
  const findName = data.find((item) => item.eid === eid);
  if (findName) {
    return findName.name;
  } else if (you && you.includes(".")) {
    return you.replace(".", ", ");
  } else if (you) {
    return you;
  } else {
    return eid;
  }
}
