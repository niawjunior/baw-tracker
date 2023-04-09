document.addEventListener('DOMContentLoaded', function () {

  chrome.storage.local.get("data", (data) => {
    var data = JSON.parse(data.data);
    if (data && data.length > 0) {
      // Loop through the saved data and create a new row for each object
      data.forEach(function (obj) {
        // Only create a new row if both eid and name are not empty
        if (obj.eid && obj.name) {
          var rowContainer = document.getElementById('row-container');
          var newRow = document.createElement('div');
          newRow.classList.add('row', 'mb-2');
          newRow.innerHTML = `
        <div class="w-1/2 pr-2">
          <input type="text" name="eid[]" placeholder="EID" class="w-full px-4 py-2 rounded-lg border border-gray-400 focus:outline-none focus:border-blue-500" value="${obj.eid}" />
        </div>
        <div class="w-1/2 pl-2">
          <input type="text" name="name[]" placeholder="Name" class="w-full px-4 py-2 rounded-lg border border-gray-400 focus:outline-none focus:border-blue-500" value="${obj.name}" />
        </div>
        <span class="delete-icon text-gray-500 cursor-pointer hover:text-red-500 ml-2">-</span>`;
          rowContainer.appendChild(newRow);
          var deleteButtons = document.querySelectorAll('.delete-icon');
          for (var i = 0; i < deleteButtons.length; i++) {
            deleteButtons[i].addEventListener('click', function () {
              this.parentNode.remove();
            });
          }
        }
      });
    }


  });

  var addButton = document.querySelector('.plus-icon');

  addButton.addEventListener('click', function () {
    var rowContainer = document.getElementById('row-container');
    var newRow = document.createElement('div');
    newRow.classList.add('row', 'mb-2');
    newRow.innerHTML = `
    <div class="w-1/2 pr-2">
      <input type="text" name="eid[]" placeholder="EID" class="w-full px-4 py-2 rounded-lg border border-gray-400 focus:outline-none focus:border-blue-500" />
    </div>
    <div class="w-1/2 pl-2">
      <input type="text" name="name[]" placeholder="Name" class="w-full px-4 py-2 rounded-lg border border-gray-400 focus:outline-none focus:border-blue-500" />
    </div>
    <span class="delete-icon text-gray-500 cursor-pointer hover:text-red-500 ml-2">-</span>`;
    rowContainer.appendChild(newRow);

    var deleteButtons = document.querySelectorAll('.delete-icon');
    for (var i = 0; i < deleteButtons.length; i++) {
      deleteButtons[i].addEventListener('click', function () {
        this.parentNode.remove();
      });
    }
  });



  var applyButton = document.getElementById('apply-button');
  var messageContainer = document.querySelector('#message-container');
  applyButton.addEventListener('click', function () {

    var data = [];
    var rows = document.querySelectorAll('#row-container .row')
    var isValid = true;

    rows.forEach(function (item) {
       var eidInput = item.querySelector('input[name="eid[]"]');
         var nameInput = item.querySelector('input[name="name[]"]');

         var eidValue = eidInput.value.trim();
         var nameValue = nameInput.value.trim();
      if (eidValue === '' && nameValue === '') {
        // Skip empty rows
        return;
      }
      if (eidValue === '' || nameValue === '') {
        isValid = false;
        messageContainer.innerHTML = '<p class="mt-4 text-red-500">Please fill out all fields</p>';
        return;
      }

      if (eidValue !== '' && nameValue !== '') {
        var existingObject = data.find(function(obj) {
          return obj.eid === eidValue
        })

        if (existingObject) {
          isValid = false;
          messageContainer.innerHTML = `<p class="mt-4 text-red-500">This EID ${eidValue} already exists.</p>`;
          return;
        } else {
          data.push({ eid: eidValue, name: nameValue });
        }
      }

    });
    if (isValid) {
      console.log(data)
      chrome.runtime.sendMessage({
        type: "apply",
        value: JSON.stringify(data),
      }).then(() => {
         // Show confirmation message
        // if (data.length === 0) {
        //    messageContainer.innerHTML = '<p class="text-red-500">Please enter at least one EID and Name.</p>'
        // } else {
           messageContainer.innerHTML = '<p class="mt-4 text-green-500">Data saved successfully</p>'
    
           // Close the window after a delay
           setTimeout(function() {
             window.close();
           }, 1000);

        // }
      })
    }
  
  });


  var closeButton = document.getElementById('close-button');

  closeButton.addEventListener('click', function () {
    window.close();
  });


  var checkButton = document.getElementById('check-button');

  checkButton.addEventListener('click', function () {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      var tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, {
        action: 'get-info'
      })
      // chrome.runtime.sendMessage({
      //   type: "check",
      // }).then((data) => {
      //   console.log(data);
      // })
    })
  });
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.user) {
        var lastSavedBy = document.querySelector('#last-saved');
        lastSavedBy.innerHTML = request.user;
      }
    })
})
