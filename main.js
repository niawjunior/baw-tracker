chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  var params = new URLSearchParams(document.location.search);
  var containerRef = params.get("containerRef");
  if (request.action === "get-view-data") {
    var getCoach = await getCoachID(containerRef);
    var allCoachViewID = getCoach.data.CoachView.items.map((item) => item.poId);

    var allCoachViewData = await Promise.all(
      allCoachViewID.map(async (id) => {
        return await getCurrentCoachViewData(id, containerRef);
      })
    );
    var mapCoachViewData = allCoachViewData.map((item) => item.data);
    chrome.runtime.sendMessage({
      type: "get-view-data",
      value: {
        views: mapCoachViewData,
        coaches: getCoach.data.COACHFLOW.items,
        bo: getCoach.data.BusinessObject.items,
        services: getCoach.data.SERVICEFLOW.items,
      },
    });
    sendResponse({
      received: true,
    });
  }
  if (request.action === "get-last-saved") {
    const editingInfo = document.querySelector("#editingInfo");
    if (editingInfo) {
      const eid = getEidFromEditingInfo(editingInfo);
      const currentUser = getCurrentUser(eid, request.value);
      const user = editingInfo.innerHTML
        .replace(/Last saved/, "")
        .replace(/by.*/, `by ${currentUser}`);
      var currentPage = document.querySelector(
        "#editorDropdown > tbody > tr > td.dijitReset.dijitStretch.dijitButtonContents > div.dijitReset.dijitInputField.dijitButtonText.editorDropDownLabel > span"
      )?.textContent;
      chrome.runtime.sendMessage({
        type: "get-last-saved",
        value: {
          currentPage: currentPage,
          modifiedBy: user,
        },
      });
      sendResponse({
        received: true,
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

  function findElement(el, layoutItemId) {
    const results = [];

    function findContributions(data, path) {
      for (let i = 0; i < data.length; i++) {
        const contributions = data[i].contributions;
        if (contributions) {
          for (let l = 0; l < contributions.length; l++) {
            const contrib = contributions[l];
            const contribLayoutItemId = contrib.layoutItemId;
            const nestedContentBoxContrib = contrib.contentBoxContrib;

            if (contribLayoutItemId === layoutItemId) {
              results.push(`${path}/${contribLayoutItemId}`);
            }

            if (nestedContentBoxContrib) {
              search(
                nestedContentBoxContrib,
                `${path}/${contrib.layoutItemId}`
              );
            }
          }
        }
      }
    }
    function search(el, parentPath) {
      if (!el || !Array.isArray(el)) return;

      for (let i = 0; i < el.length; i++) {
        const item = el[i];
        const layout =
          item.CoachViewModel?.layout || item.coachDefinition?.layout;
        const header = item.CoachViewModel?.header || item;
        const layoutItem = layout?.layoutItem;

        let path = parentPath;
        if (header?.name) {
          path = path ? `${path}/${header.name}` : `${header.name}`;
        }
        if (layoutItem) {
          for (let j = 0; j < layoutItem.length; j++) {
            const li = layoutItem[j];
            if (li.layoutItemId === layoutItemId) {
              results.push(`${path}/${layoutItemId}`);
            }

            const contentBoxContrib = li.contentBoxContrib;

            if (contentBoxContrib) {
              for (let k = 0; k < contentBoxContrib.length; k++) {
                const cb = contentBoxContrib[k];
                const contributions = cb.contributions;
                if (contributions) {
                  for (let l = 0; l < contributions.length; l++) {
                    const contrib = contributions[l];
                    const contribLayoutItemId = contrib.layoutItemId;
                    const nestedContentBoxContrib = contrib.contentBoxContrib;
                    if (contribLayoutItemId === layoutItemId) {
                      results.push(
                        `${path}/${li.layoutItemId}/${layoutItemId}`
                      );
                    }

                    if (nestedContentBoxContrib) {
                      search(
                        nestedContentBoxContrib,
                        `${path}/${li.layoutItemId}/${contribLayoutItemId}`
                      );
                    }
                  }
                }
              }
            }

            search(
              li.layoutItem,
              path ? `${path}/${li.layoutItemId}` : `${li.layoutItemId}`
            );
          }
        } else {
          findContributions(el, path);
        }
      }
    }

    search(el, "");

    return results;
  }

  function searchFunction(functionName, str) {
    // Create a regular expression to search for the function name
    const regex = new RegExp(`\\.${functionName}\\s*=\\s*function\\(`); // Use the regular expression to search for the function name in the string

    return regex.test(str);
  }

  if (request.action === "get-path") {
    var getCoach = await getCoachID(containerRef);
    var allCoachViewID = getCoach.data.CoachView.items.map((item) => item.poId);
    var allCoachFlowID = getCoach.data.COACHFLOW.items.map((item) => item.poId);

    var allCoachViewData = await Promise.all(
      allCoachViewID.map(async (id) => {
        return await getCurrentCoachViewData(id, containerRef);
      })
    );

    var allCoachFlowwData = await Promise.all(
      allCoachFlowID.map(async (id) => {
        return await getCurrentCoachViewData(id, containerRef);
      })
    );

    var mapCoachViewData = allCoachViewData.map((item) => item.data);

    var mapCoachFlowData = allCoachFlowwData
      .map((item) => {
        return item.data.definitions.rootElement.map((v) => {
          return {
            name: v.name,
            coachDefinition: v.extensionElements.userTaskImplementation
              .find((v) => v.flowElement)
              .flowElement.find((v) => v.formDefinition).formDefinition
              .coachDefinition,
          };
        });
      })
      .flat(Infinity);

    var findElementByControlIDFromCoachViews = findElement(
      mapCoachViewData,
      request.value.trim()
    );
    var findElementByControlIDFromCoachFlows = findElement(
      mapCoachFlowData,
      request.value.trim()
    );
    var findElementByControlID = [
      ...findElementByControlIDFromCoachViews,
      ...findElementByControlIDFromCoachFlows,
    ];

    var allInlineJS = mapCoachViewData.map((item) => {
      return {
        path: item.CoachViewModel.header.name,
        script: item.CoachViewModel.inlineScript?.find(
          (v) => v.scriptType === "JS"
        )?.scriptBlock,
      };
    });
    var filterMatchFunction = allInlineJS.filter((item) => {
      return searchFunction(request.value.trim(), item.script);
    });

    chrome.runtime.sendMessage({
      type: "get-path",
      value: {
        functions: filterMatchFunction,
        controlIds: findElementByControlID,
      },
    });

    sendResponse({
      received: true,
    });
  }
});

async function getCurrentCoachViewData(coachView, containerRef) {
  return fetch(
    `https://${window.location.host}/rest/bpm/wle/pd/v1/coachview/${coachView}?containerRef=${containerRef}&avoidBasicAuthChallenge=true`,
    {
      headers: {
        accept: "application/json",
        "accept-language": "en",
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      referrer: `https://${window.location.host}/WebPD/jsp/bootstrap.jsp?containerRef=${containerRef}&WorkflowCenter=/processapps/toolkits/localRepo?BAW=true&BAW_tWAS=true&filterBy=all&sortAsc=false&sortBy=recently_updated`,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  ).then((res) => res.json());
}
async function getCoachID(containerRef) {
  var params = new URLSearchParams(document.location.search);
  var containerRef = params.get("containerRef");

  return fetch(
    `https://${window.location.host}/rest/bpm/wle/pd/v1/assets?containerRef=${containerRef}&avoidBasicAuthChallenge=true`,
    {
      headers: {
        accept: "application/json",
        "accept-language": "en",
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      referrer: `https://${window.location.host}/WebPD/jsp/bootstrap.jsp?containerRef=${containerRef}&WorkflowCenter=/processapps/toolkits/localRepo?BAW=true&BAW_tWAS=true&filterBy=all&sortAsc=false&sortBy=recently_updated`,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  ).then((result) => result.json());
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
  } else if (eid === "you") {
    return you.replace(".", ", ");
  } else {
    return eid;
  }
}
