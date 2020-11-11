// for the various browsers
const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitINdexedDB || window.msIndexedDB || window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({target}) => {
   let db = target.result;
   db.createObjectStore("pending", {autoIncrement: true});
};

request.onsuccess = ({target}) => {
   db = target.result;
   if (navigator.onLine) {
      checkDatabase();
   }
};

request.onerror = (event) => {
   console.log("Error!" + event.target.errorCode);
};

function saveRecord(record) {
   const transaction = db.transaction(["pending"], "readwrite");
   const store = transaction.objectStore("pending");
   store.add(record);
}

function checkDatabase() {
   const transaction = db.transaction(["pending"], "readwrite");
   const store = transaction.objectStore("pending");
   const getAll = store.getAll();

   getAll.onsuccess = function() {
      if (getAll.result.length > 0) {
         fetch("/api/transaction/bulk", {
            method: "POST",
            body: JSON.stringify(getAll.result),
            headers: {
               accept: "application/json, text.plain, */*",
               "content-type": "application/json"
            }
         })
         .then(response => {
            return response.json();
         })
         .then(() => {
            const transaction = db.transaction(["pending"], "readwrite");
            const store = transaction.objectStore("pending");
            store.clear();
         });
      }
   };
}

// listens for app to be online
window.addEventListener("online", checkDatabase);