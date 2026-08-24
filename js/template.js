let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
let includeHTMLPromise = null;

/** Initializes shared includes, contacts, and the signed-in user avatar. */
async function initTemplate() {
    await includeHTML();
    await loadDataContacts();
    showInitials();
}


/** Loads shared HTML once and reuses the in-flight request. */
async function includeHTML() {
    if (includeHTMLPromise) return includeHTMLPromise;

    includeHTMLPromise = loadIncludes();
    try {
        await includeHTMLPromise;
    } finally {
        includeHTMLPromise = null;
    }
}

/** Fetches and inserts every element marked with w3-include-html. */
async function loadIncludes() {
    const includeElements = Array.from(document.querySelectorAll('[w3-include-html]'));
    let basePath = window.location.pathname.includes('Joyn-Juls') ? '/Joyn-Juls/' : '/';

    await Promise.all(includeElements.map(async element => {
        const file = element.getAttribute("w3-include-html");

        try {
            const resp = await fetch(basePath + file);
            if (!resp.ok) throw new Error(`Could not load ${file}`);
            element.innerHTML = await resp.text();
            element.removeAttribute("w3-include-html");
        } catch (error) {
            element.innerHTML = 'Page not found';
            console.error(error);
        }
    }));

    currentPage();
}


/** Navigates to the previous browser-history entry. */
function goBack() {
  window.history.back();
}

/** Toggles the compact user submenu. */
function toggleSubMenu() {
  let element = document.getElementById('subMenu');
  element.classList.toggle('open');
}

/** Highlights navigation entries matching the current page. */
function currentPage() {
  const pageMap = {
    'summary.html': 'summaryMenu',
    'addTask.html': 'addTaskMenu',
    'board.html': ['boardMenu', 'boardMenuResposive'],
    'contacts.html': 'contactsMenu',
    'legalNotice.html': 'legalNoticeMenu',
    'privacyPolicy.html': 'privacyPolicyMenu',
    'legalNoticeNoLogin.html': 'legalNoticeNoLoginMenu',
    'privacyPolicyNoLogin.html': 'privacyPolicyNoLoginMenu'
  };

  const pageName = window.location.href.split('/').pop();
  const targetIds = pageMap[pageName];
  if (!targetIds) return;
  const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
  ids.forEach(markCurrentNavigationItem);
}

/** Marks one navigation item as the active page. */
function markCurrentNavigationItem(id) {
  document.getElementById(id)?.classList.add('currentPage');
}


/** Renders initials for the active user in the shared header. */
function showInitials() {
  const userIcon = document.getElementById('userIcon');
  if (!userIcon || !currentUser?.name) return;
  userIcon.innerHTML = `<div>${getNameInitials(currentUser.name)}</div>`;
}

/** Returns first and last initials for a display name. */
function getNameInitials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || '';
  const last = parts.length > 1 ? parts.at(-1).charAt(0).toUpperCase() : '';
  return first + last;
}


/** Removes local session data for the active user. */
function clearStorage() {
  sessionStorage.removeItem("currentUser");
}

/** Signs out from Firebase and returns to the welcome page. */
async function logout() {
   if (window.firebaseAuth?.signOut) await window.firebaseAuth.signOut();
   clearStorage();
   window.location.href = "./index.html";
}

/** Returns the board-card markup for one task. */
function getTaskTemplate(toDo, i, taskTypeBackgroundColor, taskType, taskAssignee, taskPriorityIcon, completedSubtasks, editSubtask, id, subtaskHTML) {
  const isDraggable = canCurrentUserModifyTask(toDo);
  return `<div class="card" draggable="${isDraggable}" ondragstart="startDragging('${id}')" data-id="${id}">
    <div class="cardContent"><span class="labelUser" style="background-color: ${taskTypeBackgroundColor};">${taskType}</span>
      <div class="contextContent"><span class="cardTitle">${toDo.title}</span>
        <div><span class="cardContext">${toDo.description}</span></div>
        ${getTaskProgressHTML(i, completedSubtasks, toDo.subcategory.length)}
        <div class="contactContainer"><div style="display:flex;">${taskAssignee}</div>
          <div><img class="urgentSymbol" src="${taskPriorityIcon}" alt="${toDo.prio}"></div>
        </div>
      </div>
    </div>
  </div>`;
}

/** Returns the subtask progress markup for a task card. */
function getTaskProgressHTML(index, completed, total) {
  return `<div class="progressbar"><div class="progressbarContainer">
    <div class="bar" id="progressBarId${index}"></div></div>
    <div class="subtasks">${completed}/${total} Subtasks</div></div>`;
}

/** Returns editable markup for every supplied subtask. */
function getEditSubtaskHTML(editSubtask) {
  return editSubtask.map(getSubcategoryEditorHTML).join('');
}

/** Adds empty-state placeholders to board columns without tasks. */
function checkIfEmpty() {
  const messages = { triage: 'No tasks in Triage', toDo: 'No tasks To do',
    progress: 'Nothing in progress', feedback: 'No tasks awaiting feedback',
    done: 'No tasks done' };
  Object.entries(messages).forEach(([id, message]) => renderEmptyColumn(id, message));
}

/** Renders one empty-board-column placeholder when required. */
function renderEmptyColumn(id, message) {
  const column = document.getElementById(id);
  if (column?.innerHTML.trim() !== '') return;
  column.innerHTML = `<div class="noTasks"><span class="noTaskText">${message}</span></div>`;
}

/** Returns one selectable contact row for task assignment. */
function generateAssignedContactsHTML(initials, contactName, id, color) {
  return `
      <div class="at-contact-layout" onclick="handleContactSelection(event, '${id}')">
          <div class="at-contact-name-container">
              <div class="at-contact-shortcut-layout" style="background-color: ${color};">
                  <div class="at-contact-shortcut">${initials}</div>
              </div>
              <div class="at-contact-name">${contactName}</div>
          </div>
          <label class="at-label-checkbox">
              <input data-contact-id="${id}" data-contact-color="${color}" data-contact-initials="${initials}" type="checkbox">
              <span class="at-checkmark"></span>
          </label>
      </div>`;
}

/** Returns the desktop contact-detail markup. */
function getContactViewTemplate(contact, i) {
  return `${getContactProfileHTML(contact, i)}
    <div class="contactInformation"><p>Contact Information</p></div>
    <div>${getContactInformationHTML(contact)}</div>`;
}

/** Returns a contact's avatar, name, and desktop actions. */
function getContactProfileHTML(contact, index) {
  return `<div class="profileName">
    <div class="profilePictureContact" id="pictureViewContact" style="background-color: ${contact.profileColor}">${contact.initials}</div>
    <div class="nameEditBox"><div class="nameBox"><h2>${getContactDisplayName(contact)}</h2></div>
      <div class="editDivContact">
        <div class="editBox" id="editDiv" onclick="showEditContact(${index})"><img src="assets/img/edit_contact.png" alt="edit"><p>Edit</p></div>
        <div class="editBox" id="deleteDiv" onclick="deleteContact('/contacts/${contact.id}')"><img src="assets/img/delete_contact.png" alt=""><p>Delete</p></div>
      </div>
    </div>
  </div>`;
}

/** Returns a contact's email and phone fields. */
function getContactInformationHTML(contact) {
  return `<div class="showOneContact"><div class="showOneContactInfo">
    <h3>Email</h3><a id="emailFromContact" href="mailto:${contact.mail}">${contact.mail}</a>
    </div><div class="showOneContactInfo"><h3>Phone</h3>
    <p id="phoneFromContact">${contact.phone}</p></div></div>`;
}

/** Returns the mobile contact-detail markup. */
function getResponsiveContactTemplate(contact, i) {
  return `<div onclick="closeEditDiv()">${getContactProfileHTML(contact, i)}
    <div class="contactInformation"><p>Contact Information</p></div>
    <div onclick="closeEditDiv()">${getContactInformationHTML(contact)}</div>
    ${getResponsiveContactActionsHTML(contact, i)}</div>`;
}

/** Returns mobile edit/delete controls for a contact. */
function getResponsiveContactActionsHTML(contact, index) {
  return `<div onclick="event.stopPropagation(), showEditDiv(${index})" id="editContactThirdSection"><img src="./assets/img/points_white.png" alt=""></div>
    <div id="editDivResp" onclick="event.stopPropagation()">
      <div id="editContactResp" onclick="event.stopPropagation(event), showEditContact(${index})"><img src="./assets/img/edit_contact.png" alt=""><p>Edit</p></div>
      <div id="deleteContactResp" onclick="event.stopPropagation(event), deleteContact('/contacts/${contact.id}'), closeEditResponsive()"><img src="./assets/img/delete_contact.png" alt=""><p>Delete</p></div>
    </div>`;
}

/** Returns the contact-edit form markup. */
function getEditContactTemplate(contact, i) {
  return `<div id="closeAddContactDiv"><img onclick="cancelEditContact()" id="addNewContactCloseButton" src="/assets/img/Close.png" alt="close"></div>
    <div class="profileDivContact"><div id="editProfilePicture"><div id="whiteCircle"><div id="initialsEditContact"><h1 id="initialsText"></h1></div></div></div>
      <div id="contactInput">${getEditContactInputsHTML()}
        <div id="addNewContactAlert"></div><div id="btnDiv">
          <button onclick="cancelEditContact(); deleteDataContact('/contacts/${contact.id}')" id="cancelButtonContact">Delete<img id="cancelIcon" src="./assets/img/cancel(x).png" alt=""></button>
          <button onclick="editContactToArray(${i}), deleteDataContact('/contacts/${contact.id}')" id="editContactButton">Save<img src="./assets/img/check.png" alt=""></button>
        </div>
      </div>
    </div>`;
}

/** Returns the input group used by the contact-edit form. */
function getEditContactInputsHTML() {
  return `<div id="inputDiv"><div id="inputBox" class="inputBox">
    <input class="inputBlueBorder" id="editName" required type="text" placeholder="Name"><img src="/assets/img/person.png"></div>
    <div class="inputBox"><input id="editEmail" type="email" required placeholder="Email"><img src="/assets/img/mail.png"></div>
    <div class="inputBox"><input id="editPhone" type="number" pattern="[0-9]" placeholder="Phone"><img src="/assets/img/call.png"></div></div>`;
}

/** Returns the complete task-detail overlay markup. */
function getOverlayTemplate(taskTitle, taskDescription, taskDueDate, taskPriority, taskPriorityIcon, taskType, taskTypeBackgroundColor, assigneeOverlayContent, subtaskHTML, id, taskCreator, aiGenerated) {
  const creatorName = taskCreator?.name || taskCreator?.email || 'Unknown';
  const creator = getCreatorOverlayParts(taskCreator, creatorName);
  const aiBadge = getAiBadgeHTML(aiGenerated);
  const taskActions = getTaskActionsHTML(id, taskCreator);
  return getEditTaskShellHTML(id) + getTaskOverlayHeaderHTML(taskType,
    taskTypeBackgroundColor, aiBadge, taskTitle) + getTaskOverlayDetailsHTML(
    taskDescription, creatorName, creator, taskDueDate, taskPriority,
    taskPriorityIcon, assigneeOverlayContent, subtaskHTML) + taskActions;
}

/** Returns the hidden edit-task shell embedded in the task overlay. */
function getEditTaskShellHTML(id) {
  return `<section id="edit-task-overlay${id}" class="edit-task-overlay d-none">
    <section class="edit-close-btn-container"><img class="closeButton" onclick="off()" src="./assets/img/Close.png" alt=""></section>
    <form id="edit-main-input-container${id}" class="main-input-container" w3-include-html="template/addTaskTemplate.html"></form>
    <div class="edit-btn-position-container"><div onclick="addTask()" class="board-task-edit-btn"><div>Ok</div><img src="assets/img/check(ok).png"></div></div>
  </section>`;
}

/** Returns category, AI badge, close button, and title for a task overlay. */
function getTaskOverlayHeaderHTML(type, color, aiBadge, title) {
  return `<section class="overlayUserTitle"><div class="overlayMeta">
    <span style="background-color: ${color};" class="overlayUser">${type}</span>${aiBadge}
    </div><img class="closeButton" onclick="off()" src="./assets/img/Close.png" alt=""></section>
    <section><span class="overlayTitle">${title}</span></section>`;
}

/** Returns creator, date, priority, assignees, and subtasks for an overlay. */
function getTaskOverlayDetailsHTML(description, creatorName, creator, date,
  priority, icon, assignees, subtasks) {
  return `<section class="overlayContext"><span>${description}</span></section>
    <section class="creatorSection"><span class="dueDate">Creator:</span>${creator.badge}
      <span class="creatorName">${creatorName}</span>${creator.action}</section>
    <section class="dateDiv"><span class="dueDate">Due date:</span><span class="date">${date}</span></section>
    <section class="prioDiv"><span class="dueDate">Priority:</span><span class="urgencyText">${priority}
      <img class="overlayUrgencyImg" src="${icon}" alt="${priority}"></span></section>
    <section><span class="contactOverlay">Assigned To:</span>${assignees}</section>
    <div class="subtasksOverlay"><span>Subtasks</span></div>${subtasks}`;
}

/** Returns creator badge and action markup for a task overlay. */
function getCreatorOverlayParts(creator, name) {
  const isExternal = creator?.type === 'external';
  const isGuest = creator?.role === 'guest';
  return { badge: getCreatorBadgeHTML(isExternal, isGuest),
    action: getCreatorActionHTML(creator, name, isExternal, isGuest) };
}

/** Returns internal or external creator badge markup. */
function getCreatorBadgeHTML(isExternal, isGuest) {
  if (isExternal) return `<span class="creatorBadge creatorBadgeExternal"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>Extern</span>`;
  const label = isGuest ? 'Guest' : 'Member';
  return `<span class="creatorBadge creatorBadgeMember"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-4 2.5-6 6-6s6 2 6 6M15 14c3-.5 5 1.5 5 4.5"/></svg>${label}</span>`;
}

/** Returns the email or profile action for a task creator. */
function getCreatorActionHTML(creator, name, isExternal, isGuest) {
  if (isGuest) return '';
  if (isExternal) return `<a class="creatorAction" href="mailto:${creator?.email || ''}" aria-label="Send email to ${name}"><svg class="creatorActionIcon" aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="15" height="11" rx="1"/><path d="m4 7 6.5 5L17 7M19 14v5m-2-2h4"/></svg>E-mail</a>`;
  const email = encodeURIComponent(creator?.email || '');
  return `<a class="creatorAction" href="./contacts.html?email=${email}" aria-label="Open profile of ${name}"><svg class="creatorActionIcon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M5 20c0-4.5 2.5-7 7-7s7 2.5 7 7z"/></svg>Profil</a>`;
}

/** Returns the supplied AI-generated asset when the task was generated by AI. */
function getAiBadgeHTML(aiGenerated) {
  return aiGenerated ? `<img class="aiGeneratedHint" src="./assets/img/Note_KI generiert.svg" alt="AI-generated ticket">` : '';
}

/** Returns task edit and delete controls for authorized sessions. */
function getTaskActionsHTML(id, taskCreator) {
  if (!canCurrentUserModifyTask({ creator: taskCreator })) return '';
  return `<section class="taskActions"><div id="editDiv" class="editDiv">
    <div class="deleteDiv" onclick="deleteTask('${id}'); off();"><img class="deletePng" src="./assets/img/delete (1).png" alt=""><span>Delete</span></div>
    <div class="vector"></div><div class="deleteDiv" onclick="ShowEditOverlay('${id}')">
    <img class="deletePng" src="./assets/img/edit (1).png" alt=""><span>Edit</span></div>
  </div></section>`;
}
