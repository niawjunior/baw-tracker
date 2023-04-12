chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "get-view-data") {
    var params = new URLSearchParams(document.location.search);
    var containerRef = params.get("containerRef");

      var getCoach = await getCoachID(containerRef)
      // var currentView = document.querySelector('#editorDropdown > tbody > tr > td.dijitReset.dijitStretch.dijitButtonContents > div.dijitReset.dijitInputField.dijitButtonText.editorDropDownLabel > span').textContent;
      // var currentCoachID = getCoach.data.CoachView.items.find(item => item.name === currentView).poId
      var allCoachViewID = getCoach.data.CoachView.items.map(item => item.poId);

      var allCoachViewData = await Promise.all(allCoachViewID.map(async (id) => {
        return await getCurrentCoachViewData(id, containerRef);
      }))
      var mapCoachViewData = allCoachViewData.map(item => item.data);
      chrome.runtime.sendMessage({
        type: "coach-view-data",
        value: mapCoachViewData
      });

      // var currentData = await getCurrentCoachViewData(currentCoachID, containerRef)

      // var result = currentData.data.CoachViewModel.inlineScript;
      // var jsScript = result.find(item => item.scriptType === "JS").scriptBlock
  }
  if (request.action === "get-info") {
    const editingInfo = document.querySelector("#editingInfo");
    if (editingInfo) {
      const eid = getEidFromEditingInfo(editingInfo);
      const currentUser = getCurrentUser(eid, request.value);
      const user = editingInfo.innerHTML.replace(/by.*/, `by ${currentUser}`);
      chrome.runtime.sendMessage({
        type: "user",
        value: user
      });
    }
    const userPresenceDialog = document.querySelector("#userPresenceDialog");
    if (userPresenceDialog) {
      const users = userPresenceDialog.querySelectorAll(
        "div > div > div > div > span"
      );
        const data = request.value;
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

async function getCurrentCoachViewData (coachView, containerRef) {
  return fetch(`https://wf-baw-dev.edp-content-preprod.aws-int.thomsonreuters.com/rest/bpm/wle/pd/v1/coachview/${coachView}?containerRef=${containerRef}&avoidBasicAuthChallenge=true`, {
    "headers": {
      "accept": "application/json",
      "accept-language": "en",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Google Chrome\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest"
    },
    "referrer": `https://wf-baw-dev.edp-content-preprod.aws-int.thomsonreuters.com/WebPD/jsp/bootstrap.jsp?containerRef=${containerRef}&WorkflowCenter=/processapps/toolkits/localRepo?BAW=true&BAW_tWAS=true&filterBy=all&sortAsc=false&sortBy=recently_updated`,
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  }).then(res => res.json())
}
async function getCoachID (containerRef) {
  var params = new URLSearchParams(document.location.search);
  var containerRef = params.get("containerRef");

return fetch(`https://wf-baw-dev.edp-content-preprod.aws-int.thomsonreuters.com/rest/bpm/wle/pd/v1/assets?containerRef=${containerRef}&avoidBasicAuthChallenge=true`, {
"headers": {
  "accept": "application/json",
  "accept-language": "en",
  "content-type": "application/x-www-form-urlencoded",
  "sec-ch-ua": "\"Google Chrome\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-requested-with": "XMLHttpRequest"
},
"referrer": `https://wf-baw-dev.edp-content-preprod.aws-int.thomsonreuters.com/WebPD/jsp/bootstrap.jsp?containerRef=${containerRef}&WorkflowCenter=/processapps/toolkits/localRepo?BAW=true&BAW_tWAS=true&filterBy=all&sortAsc=false&sortBy=recently_updated`,
"referrerPolicy": "strict-origin-when-cross-origin",
"body": null,
"method": "GET",
"mode": "cors",
"credentials": "include"
}).then(result => result.json())  
}

function getEidFromEditingInfo(editingInfo) {
  return editingInfo.innerHTML.split("by")[1].slice(0, -1).trim();
}

function getCurrentUser(eid, data) {
  const you = document.querySelector(
    "#common-header > div.dbac--main > header > div > div > nav > ul > li > button > div > span"
  )?.innerHTML;
  const findName = data.find((item) => item.eid === eid);
  if (findName) {
    return findName.name;
  } else if (eid === 'you') {
    return you.replace(".", ", ");
  } else {
    return eid;
  }
}
