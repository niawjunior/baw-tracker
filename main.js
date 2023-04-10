
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "get-info") {
        if (document.querySelector('#editingInfo')) {
            var currentUser = '';
            var info = document.querySelector('#editingInfo').innerHTML;
            chrome.storage.local.get("data", (data) => {
                    var data = JSON.parse(data.data);
                    var eid = info.split('by')[1].slice(0,-1).trim();
                    var findName = data.find(item => item.eid === eid);
                    var you = document.querySelector('#common-header > div.dbac--main > header > div > div > nav > ul > li > button > div > span').innerHTML;
                    if (findName) {
                        currentUser = findName.name
                    } else if (info.includes('you')) {
                        if (you.includes('.')) {
                            currentUser = you.replace('.', ', ')
                        } else {
                            currentUser = you
                        }
                    }
                     else {
                        currentUser = eid
                    }
                    chrome.runtime.sendMessage({
                        user: info.replace(/by.*/, `by ${currentUser}`)
                    })
            })
          } 
          if (document.querySelectorAll("#userPresenceDialog")) {
              var users = document.querySelectorAll("#userPresenceDialog > div.dijitDialogPaneContent > div > div > div > div > span");
              chrome.storage.local.get("data", (data) => {
                var data = JSON.parse(data.data);
                users.forEach(user => {
                    var eid = user.innerHTML;
                    var findName = data.find(item => item.eid === eid);
                    if (findName) {
                        user.innerHTML = `${eid} (${findName.name})`
                    }
                })
              })
          }
    }
  });
  
  