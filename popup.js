document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get("data", (storedData) => {
    const data = storedData.data ? JSON.parse(storedData.data) : [];
    if (!data || data.length === 0) {
      return;
    }
    preloadEids(data);
  });

  function preloadEids(data) {
    const rowContainer = document.getElementById("row-container");
    for (const obj of data) {
      if (obj.eid && obj.name) {
        const newRow = createRow(obj.eid, obj.name);
        rowContainer.appendChild(newRow);
      }
    }

    setupDeleteButtons();
  }

  const addButton = document.querySelector(".plus-icon");
  const rowContainer = document.querySelector("#row-container");
  const messageContainer = document.querySelector("#message-container");

  addButton.addEventListener("click", () => {
    const newRow = createRow();
    rowContainer.appendChild(newRow);
  });

  rowContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-icon")) {
      event.target.parentNode.remove();
    }
  });

  function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll(".delete-icon");
    for (const button of deleteButtons) {
      button.addEventListener("click", function () {
        this.parentNode.remove();
      });
    }
  }

  function createRow(eid = "", name = "") {
    const newRow = document.createElement("div");
    newRow.classList.add("row", "mb-2");

    const eidInput = document.createElement("input");
    eidInput.setAttribute("type", "text");
    eidInput.setAttribute("name", "eid[]");
    eidInput.setAttribute("placeholder", "EID");
    eidInput.setAttribute(
      "class",
      "w-full px-4 py-2 mx-2 rounded-lg border border-gray-400 focus:outline-none focus:border-blue-500"
    );
    eidInput.setAttribute("value", eid);

    const nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("name", "name[]");
    nameInput.setAttribute("placeholder", "Name");
    nameInput.setAttribute(
      "class",
      "w-full px-4 py-2 mx-2 rounded-lg border border-gray-400 focus:outline-none focus:border-blue-500"
    );
    nameInput.setAttribute("value", name);

    const deleteButton = document.createElement("span");
    deleteButton.classList.add(
      "delete-icon",
      "text-gray-500",
      "cursor-pointer",
      "hover:text-red-500",
      "ml-2"
    );
    deleteButton.innerText = "-";

    newRow.appendChild(eidInput);
    newRow.appendChild(nameInput);
    newRow.appendChild(deleteButton);

    return newRow;
  }

  const applyButton = document.querySelector("#apply-button");

  function validateData(rows) {
    const data = [];
    let isValid = true;

    rows.forEach(function (item) {
      const eidInput = item.querySelector('input[name="eid[]"]');
      const nameInput = item.querySelector('input[name="name[]"]');

      const eidValue = eidInput.value.trim();
      const nameValue = nameInput.value.trim();

      if (eidValue === "" || nameValue === "") {
        isValid = false;
        const message = document.createElement("p");
        message.className = "mt-4 text-red-500";
        message.textContent = "Please fill out all fields";
        messageContainer.appendChild(message);
        return;
      }

      const existingObject = data.find(function (obj) {
        return obj.eid === eidValue;
      });

      if (existingObject) {
        isValid = false;
        const message = document.createElement("p");
        message.className = "mt-4 text-red-500";
        message.textContent = `This EID ${eidValue} already exists.`;
        messageContainer.appendChild(message);
        return;
      }

      data.push({ eid: eidValue, name: nameValue });
    });

    return isValid ? data : null;
  }

  applyButton.addEventListener("click", function () {
    const rows = document.querySelectorAll("#row-container .row");
    messageContainer.innerHTML = "";
    const data = validateData(rows);

    if (data) {
      chrome.runtime
        .sendMessage({
          type: "apply",
          value: JSON.stringify(data),
        })
        .then(() => {
          const message = document.createElement("p");
          message.className = "mt-4 text-green-500";
          message.textContent = "Data saved successfully";
          messageContainer.appendChild(message);

          setTimeout(function () {
            window.close();
          }, 1000);
        });
    }
  });

  function handleCloseClick() {
    window.close();
  }

  function createRowForCoachInfo(title, name, modifiedDate) {
    const tr2 = document.createElement("tr");
    tr2.classList.add(
      "bg-white",
      "border-b",
      "dark:bg-gray-800",
      "dark:border-gray-700"
    );

    const span = document.createElement("span");
    span.classList.add(
      "bg-green-100",
      "text-green-800",
      "text-xs",
      "font-medium",
      "mr-2",
      "px-2.5",
      "py-0.5",
      "rounded",
      "dark:bg-green-900",
      "dark:text-green-300"
    );
    span.textContent = title;

    const td1 = document.createElement("td");
    td1.classList.add(
      "px-6",
      "py-4",
      "font-medium",
      "text-gray-900",
      "whitespace-nowrap",
      "dark:text-white"
    );
    td1.setAttribute("scope", "row");
    td1.appendChild(span);

    const td2 = document.createElement("td");

    const spanTime = document.createElement("span");
    spanTime.classList.add(
      "px-6",
      "py-4",
      "inline-table",
      "font-bold",
      "custom-font"
    );
    spanTime.textContent = `(${convertTimestamp(modifiedDate)})`;

    td2.classList.add("px-6", "py-4", "custom-column");
    const spanText = document.createElement("span");
    spanText.textContent = name;
    spanText.classList.add("mr-2", "font-medium");

    td2.appendChild(spanText);
    td2.appendChild(spanTime);
    tr2.appendChild(td1);
    tr2.appendChild(td2);

    return tr2;
  }

  function convertTimestamp(timestamp) {
    const dateObj = new Date(timestamp);
    const year = dateObj.getFullYear();
    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const date = ("0" + dateObj.getDate()).slice(-2);
    const hours = ("0" + dateObj.getHours()).slice(-2);
    const minutes = ("0" + dateObj.getMinutes()).slice(-2);
    const seconds = ("0" + dateObj.getSeconds()).slice(-2);
    const formattedDate = `${date}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
  }

  function handleCheckClick() {
    document.querySelector("#check-button").textContent = 'Checking..'
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      function (tabs) {
        var tabId = tabs[0].id;

        chrome.storage.local.get("data", (storedData) => {
          const data = storedData.data ? JSON.parse(storedData.data) : [];
          chrome.tabs.sendMessage(tabId, {
            action: "get-info",
            value: data,
          });

          chrome.tabs.sendMessage(tabId, {
            action: "get-view-data",
          });
        });
      }
    );
  }

  function handleUserMessage(request, sender, sendResponse) {
    if (request.type === "user") {
      var lastSavedBy = document.querySelector("#last-saved");
      lastSavedBy.innerHTML = request.value;
    }

    if (request.type === "coach-view-data") {
      var numberOfViews = document.querySelector("#number-of-views");
      var numberOfCoaches = document.querySelector("#number-of-coaches");
      var numberOfBo = document.querySelector("#number-of-bo");
      var numberOfServices = document.querySelector("#number-of-services");

      numberOfCoaches.textContent = request.value.coaches?.length;
      numberOfViews.textContent = request.value.views?.length;
      numberOfBo.textContent = request.value.bo?.length;
      numberOfServices.textContent = request.value.services?.length;

      const viewsTbody = document.querySelector("#table-views-content");
      const coachesTbody = document.querySelector("#table-coaches-content");
      const boTbody = document.querySelector("#table-bo-content");
      const servicesTbody = document.querySelector("#table-services-content");

      coachesTbody.innerHTML = "";
      viewsTbody.innerHTML = "";

      chrome.storage.local.get("data", (storedData) => {
        const data = storedData.data ? JSON.parse(storedData.data) : [];

        for (const obj of request.value.coaches) {
          const findUser = data.find(function (user) {
            return user.eid === obj.modifiedBy;
          });
          const tableContent = createRowForCoachInfo(
            obj.name,
            findUser ? findUser.name : obj.modifiedBy,
            obj.modifiedOn
          );
          coachesTbody.appendChild(tableContent);
        }

        for (const obj of request.value.views) {
          const findUser = data.find(function (user) {
            return user.eid === obj.modifiedBy;
          });
          const tableContent = createRowForCoachInfo(
            obj.CoachViewModel.header.name,
            findUser ? findUser.name : obj.modifiedBy,
            obj.modifiedDate
          );
          viewsTbody.appendChild(tableContent);
        }

        for (const obj of request.value.bo) {
          const findUser = data.find(function (user) {
            return user.eid === obj.modifiedBy;
          });
          const tableContent = createRowForCoachInfo(
            obj.name,
            findUser ? findUser.name : obj.modifiedBy,
            obj.modifiedOn
          );
          boTbody.appendChild(tableContent);
        }

        for (const obj of request.value.services) {
          const findUser = data.find(function (user) {
            return user.eid === obj.modifiedBy;
          });
          const tableContent = createRowForCoachInfo(
            obj.name,
            findUser ? findUser.name : obj.modifiedBy,
            obj.modifiedOn
          );
          servicesTbody.appendChild(tableContent);
        }
      });

      document.querySelector("#check-button").textContent = 'Check';
    }
  }
  
  function exportJSON() {
     chrome.storage.local.get('data', function(result) {
       var jsonData = result.data;
       var blob = new Blob([jsonData], { type: 'application/json' });
       var url = URL.createObjectURL(blob);
           chrome.downloads.download({
         url: url,
         filename: 'data.json'
       }, function() {
         URL.revokeObjectURL(url);
       });
     });
    }

  function handleFileChange(evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    messageContainer.innerHTML = "";
    reader.onload = function(event) {
      var jsonData = JSON.parse(event.target.result);
      preloadEids(jsonData);
    }
    reader.readAsText(file);
  }
  document.querySelector("#file-input").addEventListener('change', handleFileChange)

  const exportButton = document.querySelector("#export-button");
  exportButton.addEventListener("click", exportJSON);

  const closeButton = document.querySelector("#close-button");
  closeButton.addEventListener("click", handleCloseClick);

  const checkButton = document.querySelector("#check-button");
  checkButton.addEventListener("click", handleCheckClick);

  chrome.runtime.onMessage.addListener(handleUserMessage);
});
