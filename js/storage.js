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

/** Creates a manual task from the standalone Add Task page. */
async function addTask() {
  if (!checkRequiredInput()) return;
  task = buildManualTask();
  await postTask("/task", task);
  await addTaskInit();
  goToBoard();
}

/** Creates a manual task from the Board overlay. */
async function addTaskBoard() {
  if (!checkRequiredInput()) return;
  task = buildManualTask();
  await postTask("/task", task);
  goToBoard();
}

/** Builds the shared Firebase representation of a manually created task. */
function buildManualTask() {
  return {
    title: document.getElementById("task-title").value,
    description: document.getElementById("at-description").value,
    assignedTo: choosedContacts?.length ? choosedContacts : [],
    date: document.getElementById("task-due-date").value,
    prio: taskPrio, category: categoryChoosed,
    subcategory: subcategoriesChoosed, completedSubtasks: subtaskCompleted,
    status: 'triage', creator: getCurrentTaskCreator(), source: 'manual',
    aiGenerated: false, createdAt: new Date().toISOString(),
  };
}

/** Loads and normalizes all tasks from Firebase. */
async function loadDataTask(path = "/task") {
  let response = await firebaseRequest(path);
  let responseToJson = await response.json();
  tasks = [];
  if (!responseToJson) {
    console.warn("Keine Tasks gefunden oder Firebase gibt null zurück.");
    return;
  }
  tasks = Object.entries(responseToJson).map(([id, data]) => normalizeTask(id, data));
}

/** Converts a Firebase task record into the format used by the UI. */
function normalizeTask(id, data) {
  return { id, title: data.title, description: data.description,
    assignedTo: data.assignedTo || [], date: data.date, prio: data.prio,
    category: data.category, subcategory: data.subcategory || [],
    completedSubtasks: data.completedSubtasks || [], status: data.status || "triage",
    creator: data.creator || null, source: data.source || 'manual',
    aiGenerated: data.aiGenerated === true, createdAt: data.createdAt || null };
}

/** Returns creator metadata for a manually created task. */
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


/** Appends a task to Firebase and returns its generated key. */
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

/** Replaces task data at a Firebase path. */
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



/** Replaces contact data at a Firebase path. */
async function changeContact(path = "", data = {}) {
  let response = await firebaseRequest(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

/** Appends a contact to Firebase. */
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


/** Deletes contact data at a Firebase path. */
async function deleteDataContact(path = "") {
  let response = await firebaseRequest(path, {
    method: "DELETE",
  });
  return responseToJson = await response.json();
}

/** Deletes a contact and refreshes the contact page. */
async function deleteContact(contact) {
  await deleteDataContact(contact);
  await loadDataContacts();
  renderContacts();
  document.getElementById('viewContact').innerHTML = '';
}

/** Loads all contacts from Firebase. */
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

/** Fetches user data from Firebase. */
async function fetchUserData(path) {
  let response = await firebaseRequest(path);
  return (responseToJson = await response.json());
}

/** Loads all registered member profiles. */
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

/** Stores a member profile at its Firebase UID path. */
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

/** Deletes a permitted task and refreshes the board. */
async function deleteTask(id) {
  const taskToDelete = tasks.find(taskItem => taskItem.id === id);
  if (!canCurrentUserModifyTask(taskToDelete)) return;
  await deleteDataTask(`/task/${id}`);
  await loadDataTask();
  renderTasks();
}

/** Deletes task data at a Firebase path. */
async function deleteDataTask(path) {
  let response = await firebaseRequest(path, {
    method: "DELETE"
  });
  return response.json();
}

/** Saves the values from the edit overlay to Firebase. */
async function saveTaskChanges(id) {
  await loadDataTask();
  const existingTask = tasks.find(item => item.id === id);
  if (!canCurrentUserModifyTask(existingTask)) return;
  try {
    await changeTask(`/task/${id}`, buildUpdatedTask(existingTask));
    await refreshBoardAfterTaskSave();
  } catch (error) {
    console.error('Fehler beim Speichern der Änderungen:', error);
  }
  clearEditTaskOverlayContent();
}

/** Builds a task object from edit-overlay values and immutable task data. */
function buildUpdatedTask(existingTask) {
  const subtasks = readEditedSubtasks();
  const assignees = readEditedAssignees();
  return { title: readTaskInput('task-title', 'Untitled'),
    description: readTaskInput('at-description', 'No description'),
    date: document.getElementById('task-due-date').value || todayAsIsoDate(),
    prio: getSelectedPriority(), subcategory: subtasks.length ? subtasks : existingTask.subcategory,
    assignedTo: assignees.length ? assignees : existingTask.assignedTo,
    status: existingTask.status, category: existingTask.category,
    completedSubtasks: existingTask.completedSubtasks, creator: existingTask.creator,
    source: existingTask.source, aiGenerated: existingTask.aiGenerated,
    createdAt: existingTask.createdAt };
}

/** Reads a trimmed task input and applies its fallback value. */
function readTaskInput(id, fallback) {
  return document.getElementById(id).value.trim() || fallback;
}

/** Returns today's local-independent ISO date. */
function todayAsIsoDate() {
  return new Date().toISOString().split('T')[0];
}

/** Reads all edited subtask labels. */
function readEditedSubtasks() {
  return Array.from(document.querySelectorAll('.choosed-subcategory-input'), input => input.value);
}

/** Converts one selected contact checkbox into task assignee metadata. */
function checkboxToAssignee(input) {
  return { id: input.dataset.contactId, color: input.dataset.contactColor,
    initial: input.dataset.contactInitials };
}

/** Reads selected contacts from the edit overlay. */
function readEditedAssignees() {
  const selector = '.at-label-checkbox input[type="checkbox"]:checked';
  return Array.from(document.querySelectorAll(selector), checkboxToAssignee);
}

/** Refreshes the board and closes the task overlay after a successful save. */
async function refreshBoardAfterTaskSave() {
  await loadDataTask();
  renderTasks();
  subcategoriesChoosed = [];
  off();
}
