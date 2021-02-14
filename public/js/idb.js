
// create variable to hold db connection
let db;

// establish connection to IndexedDB database called "budget_tracker"
// acts as an event listener
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the db version changes
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    console.log("event: ", event);
    // create an object store (table) called 'new_transaction' set it to have an autoIncrement
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradeneeded)
    db = event.target.result;
    //console.log("result: ", db);
    // check if app is online, if yes run saveRecord() function to send all 
    if (navigator.onLine) {
        // function to send data
        uploadTransaction();
    }
};

// if error occurs log it
request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new transaction and the...
function saveRecord(record) {
    // open a new transaction with the db with read and write permission...
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for 'new_transaction'
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to the store with add method
    budgetObjectStore.add(record);
};

// get data from indexedDB and POST to server
function uploadTransaction() {
    // open a transaction on the db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // get all records from store, set to variable
    const getAll = budgetObjectStore.getAll();

    // upon a successful .getAll() execution
    getAll.onsuccess = function() {
        // if there was data in the indexedDb's store send to api server...
        if (getAll.result.length > 0 ) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    "Content-Type": 'application/json'
                }
            })
            .then(response =>  response.json())

            .then(serverResponse => {
                //console.log("serverResponse: ", serverResponse)
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access the new_transaction object store
                const budgetObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                budgetObjectStore.clear();

                alert('All saved interactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);