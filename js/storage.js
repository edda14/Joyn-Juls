const BASE_URL =
  "https://join-323f5-default-rtdb.europe-west1.firebasedatabase.app/";
let contacts = [];
let users = [];
let tasks = [];

/**
 * Sends an authenticated request to Firebase Realtime Database.
 * Firebase web configuration is public by design; access is protected by the
 * signed-in user's short-lived ID token and the database security rules.
 * @param {string} path Database path without the .json suffix.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<Response>}
 */
async function firebaseRequest(path = '', options = {}) {
  if (!window.firebaseAuth?.getIdToken) {
    throw new Error('Firebase Authentication has not been initialized.');
  }

  const token = await window.firebaseAuth.getIdToken();
  const url = `${BASE_URL}${path}.json?auth=${encodeURIComponent(token)}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Firebase request failed (${response.status}).`);
  }
  return response;
}

async function addTask() {
  if (!checkRequiredInput()) {
    return;
  }
  let title = document.getElementById("task-title");
  let description = document.getElementById("at-description");
  let assignedTo =
    choosedContacts && choosedContacts.length > 0 ? choosedContacts : [];
  let date = document.getElementById("task-due-date");
  let prio = taskPrio;
  let status = 'triage';
  const creator = getCurrentTaskCreator();

  task = {
    title: title.value,
    description: description.value,
    assignedTo: assignedTo,
    date: date.value,
    prio: prio,
    category: categoryChoosed,
    subcategory: subcategoriesChoosed,
    completedSubtasks: subtaskCompleted,
    status: status,
    creator: creator,
    source: 'manual',
    aiGenerated: false,
    createdAt: new Date().toISOString(),
  };
  await postTask("/task", task);
  await addTaskInit();
  goToBoard();
}

async function addTaskBoard() {
  if (!checkRequiredInput()) {
    return;
  }
  let title = document.getElementById("task-title");
  let description = document.getElementById("at-description");
  let assignedTo =
    choosedContacts && choosedContacts.length > 0 ? choosedContacts : [];
  let date = document.getElementById("task-due-date");
  let prio = taskPrio;
  const creator = getCurrentTaskCreator();


  task = {
    title: title.value,
    description: description.value,
    assignedTo: assignedTo,
    date: date.value,
    prio: prio,
    category: categoryChoosed,
    subcategory: subcategoriesChoosed,
    completedSubtasks: subtaskCompleted,
    status: 'triage',
    creator: creator,
    source: 'manual',
    aiGenerated: false,
    createdAt: new Date().toISOString(),
  };
  await postTask("/task", task);
  goToBoard();
}

async function loadDataTask(path = "/task") {
  let response = await firebaseRequest(path);
  let responseToJson = await response.json();
  tasks = [];
  if (!responseToJson) {
    console.warn("Keine Tasks gefunden oder Firebase gibt null zurück.");
    return;
  }
  let taskKeysArray = Object.keys(responseToJson);
  for (let i = 0; i < taskKeysArray.length; i++) {
    let taskData = responseToJson[taskKeysArray[i]];
    tasks.push({
      id: taskKeysArray[i],
      title: taskData.title,
      description: taskData.description,
      assignedTo: taskData.assignedTo || [],
      date: taskData.date,
      prio: taskData.prio,
      category: taskData.category,
      subcategory: taskData.subcategory || [],
      completedSubtasks: taskData.completedSubtasks || [],
      status: taskData.status || "triage",
      creator: taskData.creator || null,
      source: taskData.source || 'manual',
      aiGenerated: taskData.aiGenerated === true,
      createdAt: taskData.createdAt || null,
    });
  }
}

function getCurrentTaskCreator() {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  return {
    type: 'internal',
    role: currentUser?.role || 'member',
    uid: currentUser?.uid || null,
    name: currentUser?.name || 'Guest',
    email: currentUser?.email || null,
  };
}

/**
 * Checks whether the current session may mutate a task. The original Join
 * requirements explicitly give authenticated demo guests access to every
 * board feature so employers can test the complete application.
 * @param {Object} taskToCheck
 * @returns {boolean}
 */
function canCurrentUserModifyTask(taskToCheck) {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  return Boolean(currentUser?.uid && taskToCheck);
}


async function postTask(path, task) {
  let response = await firebaseRequest(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });
  return (responseToJson = await response.json());
}

async function changeTask(path, task) {
  let response = await firebaseRequest(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });
  return (responseToJson = await response.json());
}



async function changeContact(path = "", data = {}) {
  let response = await firebaseRequest(path, {
    method: "PUT",
    header: {
      Contact: "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function postContact(path, newContact) {
  let response = await firebaseRequest(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newContact),
  });
  return (responseToJson = await response.json());
}


async function deleteDataContact(path = "") {
  let response = await firebaseRequest(path, {
    method: "DELETE",
  });
  return responseToJson = await response.json();
}

async function deleteContact(contact) {
  await deleteDataContact(contact);
  await loadDataContacts();
  renderContacts();
  document.getElementById('viewContact').innerHTML = '';
}

async function loadDataContacts(path = "/contacts") {
  let response = await firebaseRequest(path);
  let responseToJson = await response.json();
  contacts = [];
  if (!responseToJson) {
    console.warn("Keine Kontakte gefunden oder Firebase gibt null zurück.");
    return;
  }
  let contactsKeysArray = Object.keys(responseToJson);
  for (let i = 0; i < contactsKeysArray.length; i++) {
    contacts.push({
      id: contactsKeysArray[i],
      mail: responseToJson[contactsKeysArray[i]].mail,
      name: responseToJson[contactsKeysArray[i]].name,
      initials: responseToJson[contactsKeysArray[i]].initials,
      phone: responseToJson[contactsKeysArray[i]].phone,
      profileColor: responseToJson[contactsKeysArray[i]].profileColor,
    });
  }
}

async function fetchUserData(path) {
  let response = await firebaseRequest(path);
  return (responseToJson = await response.json());
}

async function loadUserData() {
  let userResponse = await fetchUserData("users");
  users = [];
  if (!userResponse) {
    console.warn("Keine User gefunden oder Firebase gibt null zurück.");
    return;
  }
  let userKeysArray = Object.keys(userResponse);
  for (let index = 0; index < userKeysArray.length; index++) {
    users.push({
      id: userKeysArray[index],
      name: userResponse[userKeysArray[index]].name,
      email: userResponse[userKeysArray[index]].email,
    });
  }
}

async function putUserData(path, userProfile) {
  let response = await firebaseRequest(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userProfile),
  });
  if (!response.ok) throw new Error("User profile could not be saved.");
  return response.json();
}

async function deleteTask(id) {
  const taskToDelete = tasks.find(taskItem => taskItem.id === id);
  if (!canCurrentUserModifyTask(taskToDelete)) return;
  await deleteDataTask(`/task/${id}`);
  await loadDataTask();
  renderTasks();
}

async function deleteDataTask(path) {
  let response = await firebaseRequest(path, {
    method: "DELETE"
  });
  return response.json();
}

async function saveTaskChanges(id) {
  await loadDataTask(); // Call loadDataTask to populate the tasks array
  const taskToUpdate = tasks.find(taskItem => taskItem.id === id);
  if (!canCurrentUserModifyTask(taskToUpdate)) return;
  const taskTitle = document.getElementById('task-title').value.trim() || 'Untitled';
  const taskDescription = document.getElementById('at-description').value.trim() || 'No description';
  const taskDueDate = document.getElementById('task-due-date').value || new Date().toISOString().split('T')[0];

  // Überprüfen und setzen der Priorität
  let taskPriority;
  const urgentElement = document.querySelector('.at-bg-urgent');
  const mediumElement = document.querySelector('.at-bg-medium');
  const lowElement = document.querySelector('.at-bg-low');

  if (urgentElement) {
    taskPriority = 'urgent';
  } else if (mediumElement) {
    taskPriority = 'medium';
  } else if (lowElement) {
    taskPriority = 'low';
  } else {
    taskPriority = 'low'; // Standardwert
  }

  // Retrieve existing task data
  let existingTask;
  for (const task of tasks) {
    if (task.id === id) {
      existingTask = task;
      break;
    }
  }

  // Get the updated subcategories from the edit overlay
  const subcategories = Array.from(document.querySelectorAll('.choosed-subcategory-input')).map(input => input.value) || [];
  const assignedToContacts = Array.from(document.querySelectorAll('.at-label-checkbox input[type="checkbox"]:checked')).map(input => {
    const contactId = input.getAttribute('data-contact-id');
    const contactColor = input.getAttribute('data-contact-color');
    const contactInitials = input.getAttribute('data-contact-initials');
    return { id: contactId, color: contactColor, initial: contactInitials };
  });


  const updatedTask = {
    title: taskTitle,
    description: taskDescription,
    date: taskDueDate,
    prio: taskPriority,
    subcategory: subcategories.length > 0 ? subcategories : existingTask.subcategory, // Use the updated subcategories if they exist, otherwise use the existing ones
    assignedTo: assignedToContacts.length > 0 ? assignedToContacts : existingTask.assignedTo,
    status: existingTask.status, // Use the existing status
    category: existingTask.category,
    completedSubtasks: existingTask.completedSubtasks,
    creator: existingTask.creator,
    source: existingTask.source,
    aiGenerated: existingTask.aiGenerated,
    createdAt: existingTask.createdAt,
  };


  try {
    // Überprüfen, was an das Backend gesendet wird
    await changeTask(`/task/${id}`, updatedTask);

    // Überprüfen, ob die Aufgabe nach dem Speichern korrekt neu geladen wird
    await loadDataTask();
    renderTasks();
    subcategoriesChoosed = [];
    // Schließen des Overlays
    off();
  } catch (error) {
    console.error('Fehler beim Speichern der Änderungen:', error);
  }
  clearEditTaskOverlayContent()
}
