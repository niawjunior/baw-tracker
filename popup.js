document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get("data", (storedData) => {
    const data = JSON.parse(storedData.data);
    if (!data || data.length === 0) {
      return;
    }

    const rowContainer = document.getElementById("row-container");
    for (const obj of data) {
      if (obj.eid && obj.name) {
        const newRow = createRow(obj.eid, obj.name);
        rowContainer.appendChild(newRow);
      }
    }

    setupDeleteButtons();
  });

  const addButton = document.querySelector(".plus-icon");
  const rowContainer = document.getElementById("row-container");
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

  const applyButton = document.getElementById("apply-button");

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
    const data = validateData(rows);

    if (data) {
      console.log(data);
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

  function handleCheckClick() {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      function (tabs) {
        var tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, {
          action: "get-info",
        });
      }
    );
  }

  function handleUserMessage(request, sender, sendResponse) {
    if (request.user) {
      var lastSavedBy = document.querySelector("#last-saved");
      lastSavedBy.innerHTML = request.user;
    }
  }

  var closeButton = document.getElementById("close-button");
  closeButton.addEventListener("click", handleCloseClick);

  var checkButton = document.getElementById("check-button");
  checkButton.addEventListener("click", handleCheckClick);

  chrome.runtime.onMessage.addListener(handleUserMessage);
});
