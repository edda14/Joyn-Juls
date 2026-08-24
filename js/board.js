/** Loads board data, shared navigation, and the initial task cards. */
async function initBoard() {
    await loadDataTask();
    await loadDataContacts();
    await includeHTML();
    checkIfEmpty();
    renderTasks();
    showInitials();
}
/**
 * Renders the tasks in their respective columns and updates the UI.
 * Generate task card using a template
 * Attach click event listener
 * Append task to the appropriate column
 * Update progress bar
 * Ensure columns display empty messages if needed
 */
function renderTasks() {
    const columns = getBoardColumns();
    Object.values(columns).forEach(column => column.innerHTML = '');
    tasks.forEach((task, index) => renderTaskCard(task, index, columns));
    checkIfEmpty();
}

/** Returns the board status-to-column mapping. */
function getBoardColumns() {
    return { triage: document.getElementById('triage'), toDo: document.getElementById('toDo'),
        progress: document.getElementById('progress'), feedback: document.getElementById('feedback'),
        done: document.getElementById('done') };
}

/** Creates one task card and appends it to its status column. */
function renderTaskCard(task, index, columns) {
    const view = getTaskCardView(task);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = getTaskTemplate(task, index, view.color, task.category,
        view.assignees, view.priorityIcon, view.completedCount, view.editSubtasks,
        task.id, view.subtasks);
    wrapper.addEventListener('click', event => openTaskFromCard(event, task, view));
    (columns[task.status] || columns.triage).appendChild(wrapper);
    updateProgressBar(view.completedCount, task.subcategory.length, index);
}

/** Collects derived values needed to render a task card and overlay. */
function getTaskCardView(task) {
    return { subtasks: getSubtask(task), editSubtasks: getEditSubtaskHTML(task.subcategory),
        completedCount: task.completedSubtasks.filter(value => value === 'true').length,
        assignees: getTaskAssignee(task.assignedTo), priorityIcon: getPriorityIcon(task.prio),
        color: task.category === 'User Story' ? '#1FD7C1' : '' };
}

/** Stops card event bubbling and opens its detail overlay. */
function openTaskFromCard(event, task, view) {
    event.stopPropagation();
    showOverlay1(task.title, task.description, task.date, task.prio, task.assignedTo,
        task.category, view.subtasks, task.id, view.editSubtasks, task.creator,
        task.aiGenerated);
}

/**
 * Retrieves the HTML for task assignees and handles overflow if there are more than three assignees.
 * @param {Array} assignedTo - Array of assigned contact objects.
 * @returns {string} - HTML string representing the task assignees.
 */
function getTaskAssignee(assignedTo) {
    if (!Array.isArray(assignedTo) || assignedTo.length === 0) return '';

    let visibleAssignees = assignedTo.slice(0, 3);
    let taskAssignee = visibleAssignees.map(assignee => {
        let contact = contacts.find(contact => contact.id === assignee.id);
        return contact ? `<div class="contactCard" style="background-color: ${assignee.color};">${assignee.initial}</div>` : '';
    }).join('');

    let remainingAssignees = assignedTo.length - visibleAssignees.length;
    if (remainingAssignees > 0) {
        taskAssignee += `<div class="contactCard otherContacts" style="background-color: #5DE2E7;">${remainingAssignees}+</div>`;
    }

    return taskAssignee;
}


/**
 * Shows the task overlay with detailed task information.
 * @async
 * @param {string} taskTitle - The title of the task.
 * @param {string} taskDescription - The description of the task.
 * @param {string} taskDueDate - The due date of the task.
 * @param {string} taskPriority - The priority of the task.
 * @param {Array} taskAssignees - The array of task assignees.
 * @param {string} taskType - The type/category of the task.
 * @param {string} subtaskHTML - The HTML content for subtasks.
 * @param {string} id - The ID of the task.
 * @param {string} editSubtask - The HTML content for editing subtasks.
 */
async function showOverlay1(taskTitle, taskDescription, taskDueDate, taskPriority, taskAssignees, taskType, subtaskHTML, id, editSubtask, taskCreator, aiGenerated) {
    const overlay = document.getElementById("overlay");
    const overlayContent = document.querySelector(".overlayContent");
    overlayContent.innerHTML = buildTaskOverlayHTML(taskTitle, taskDescription,
        taskDueDate, taskPriority, taskAssignees, taskType, subtaskHTML, id,
        taskCreator, aiGenerated);
    revealTaskOverlay(overlay, overlayContent);
    await includeHTML();
    showInitials();
}

/** Builds the complete task-detail overlay markup. */
function buildTaskOverlayHTML(title, description, date, priority, assignees,
    type, subtasks, id, creator, aiGenerated) {
    return getOverlayTemplate(title, description, date, priority,
        getPriorityIcon(priority), type, type === 'User Story' ? '#1FD7C1' : '',
        getOverlayAssignees(assignees), subtasks, id, creator, aiGenerated);
}

/** Builds the assignee rows used in the task-detail overlay. */
function getOverlayAssignees(assignees) {
    if (!Array.isArray(assignees)) return '';
    return assignees.map(assignee => getOverlayAssigneeHTML(assignee)).join('');
}

/** Builds one task-detail assignee row. */
function getOverlayAssigneeHTML(assignee) {
    const contact = contacts.find(item => item.id === assignee.id);
    if (!contact) return '';
    return `<div class="contactDiv"><span class="contactCard"
        style="background-color: ${assignee.color};"> ${assignee.initial}</span>
        <span class="contactName">${getContactDisplayName(contact)}</span></div>`;
}

/** Makes the task-detail overlay visible. */
function revealTaskOverlay(overlay, content) {
    overlay.style.display = 'flex';
    content.style.transform = 'translateX(0)';
    content.style.opacity = '1';
}

/**
 * Generates the HTML for the subtasks of a task.
 * @param {Object} toDo - The task object containing subtasks and their completion status.
 * @returns {string} - HTML string representing the subtasks.
 */
function getSubtask(toDo) {
    let subtaskHTML = '';
    const disabled = canCurrentUserModifyTask(toDo) ? '' : 'disabled';

    for (let i = 0; i < toDo.subcategory.length; i++) {
        let subtask = toDo.subcategory[i];
        let isChecked = toDo.completedSubtasks[i] === 'true' ? 'checked' : 'false';
        subtaskHTML += /*html*/ `
         <div class="checkBoxDiv">
             <input type="checkbox" id="simpleCheckbox${i}" class="checkBox" onclick="addCompletedSubtasks(${i}, '${toDo.id}')" ${isChecked} ${disabled}>
             <span class="checkBoxText">${subtask}</span>
         </div>
        `;
    }
    return subtaskHTML;
}

/**
 * Toggles the completion status of a subtask and updates the task.
 * @async
 * @param {number} i - The index of the subtask to toggle.
 * @param {string} id - The ID of the task.
 */
async function addCompletedSubtasks(i, id) {
    await loadDataTask();
    let taskItem = tasks.find(taskItem => taskItem.id === id);
    if (!canCurrentUserModifyTask(taskItem)) return;
    if (taskItem) { // Check if taskItem is not undefined
        if (taskItem.completedSubtasks[i] == 'false') {
            taskItem.completedSubtasks[i] = 'true';
        } else {
            taskItem.completedSubtasks[i] = 'false';
        }
        await changeTask(`/task/${id}/completedSubtasks`, taskItem.completedSubtasks)
        renderTasks();
    } else {
        console.error(`Task with id ${id} not found`);
    }
    renderTasks();
}

/**
 * Updates the progress bar for a task.
 * @param {number} subtasksCompleted - Number of completed subtasks.
 * @param {number} totalSubtasks - Total number of subtasks.
 * @param {number} i - Index of the task.
 */
function updateProgressBar(subtasksCompleted, totalSubtasks, i) {
    let progressPercentage = (subtasksCompleted / totalSubtasks) * 100;
    let progressBar = document.getElementById(`progressBarId${i}`);
    progressBar.style.width = progressPercentage + '%';
}

/**
 * Attaches event listeners to task cards to show an overlay when clicked.
 */
function on() {
    const overlay = document.getElementById("overlay");
    const overlayContent = document.querySelector(".overlayContent");

    const tasks = document.querySelectorAll(".card");

    tasks.forEach(task => {
        task.addEventListener("click", () => {
            overlay.style.display = "flex";
            overlayContent.style.transform = "translateX(0)";
            overlayContent.style.opacity = "1";
        });
    });
}

/**
 * Clears the content of all overlay containers that have an ID containing 'edit-task-overlay'.
 */
function clearEditTaskOverlayContent() {
    
    const overlayContainers = document.querySelectorAll('[id*="edit-task-overlay"]');

    overlayContainers.forEach(container => {
        
        container.innerHTML = '';
    });
}

/**
 * Hides the overlay by applying fade-out and slide-out animations.
 */
function off() {
    const overlay = document.getElementById("overlay");
    const overlayContent = document.querySelector(".overlayContent");
    clearEditTaskOverlayContent()

    const handleAnimationEnd = () => {
        overlay.style.display = "none";
        overlay.classList.remove("fade-out-overlay");
        overlayContent.classList.remove("slide-out-content");
        overlay.removeEventListener('animationend', handleAnimationEnd);
        overlayContent.removeEventListener('animationend', handleAnimationEnd);
    };

    overlay.addEventListener('animationend', handleAnimationEnd);
    overlayContent.addEventListener('animationend', handleAnimationEnd);

    overlayContent.classList.add("slide-out-content");
    overlay.classList.add("fade-out-overlay");
    subcategoriesChoosed = [];
}

/**
 * Displays the add task overlay and initializes it.
 * @async
 * @param {string} [status='triage'] - Initial status for newly created tasks.
 */
async function showOverlay(status = 'triage') {
    choosedContacts = [];
    await addTaskInit();
    showChoosedContacts();
    addTaskOverlay.style.display = 'block';
    document.getElementById('addTaskOverlay').dataset.status = status;

}

/**
 * Hides the add task overlay with fade-out and slide-out animations.
 */
function offAddTask(event, forceClose = false) {
    const overlay = document.getElementById("addTaskOverlay");
    const overlayContent = document.querySelector(".overlayContentAddTask");

    if (!forceClose && event && event.target !== overlay) return;

    overlayContent.classList.add("slide-out-content"); // Add the slide-out animation class
    overlay.classList.add("fade-out-overlay"); // Add the fade-out animation class

    // Wait for the animation to finish before hiding the overlay
    overlay.addEventListener("animationend", function () {
        overlay.style.display = "none"; // Hide the overlay
        overlay.classList.remove("fade-out-overlay"); // Remove the fade-out animation class
        overlayContent.classList.remove("slide-out-content"); // Remove the slide-out animation class
    }, { once: true }); // Ensure the event listener is only triggered once
}

/**
 * Returns the icon path based on the task priority.
 * @param {string} priority - The priority of the task ('urgent', 'medium', 'low').
 * @returns {string} - The path to the corresponding priority icon.
 */
function getPriorityIcon(priority) {
    switch (priority) {
        case 'urgent':
            return './assets/img/urgent.png';
        case 'medium':
            return './assets/img/medium.png';
        case 'low':
            return './assets/img/low.png';
        default:
            return '';
    }
}

/**
 * Shows the edit overlay for a specific task.
 * @async
 * @param {string} id - The ID of the task to edit.
 * Load the tasks from the backend
 * Find the specific task by its ID
 * Remove all elements with the specified classes
 * Removes the element from the DOM
 * Check assigned contacts and update checkboxes
 * Use assignedTo from task
 * Mark the checkbox as checked
 * Generate the subtask HTML if the task has subcategories
 */
async function ShowEditOverlay(id) {
    await loadDataTask();
    const task = tasks.find(task => task.id === id);
    if (!canCurrentUserModifyTask(task)) return;
    if (!task) return console.error('Task not found');
    subcategoriesChoosed = [...task.subcategory];
    await addTaskInit();
    prepareEditOverlay(id);
    bindEditSaveButton(id);
    selectAssignedContacts(task.assignedTo || []);
    const subtasks = Array.isArray(task.subcategory) ? getEditSubtaskHTML(task.subcategory) : '';
    renderEditTaskData(id, task.title, task.description, task.date, task.prio, subtasks);
}

/** Switches the detail overlay into its task-edit form. */
function prepareEditOverlay(id) {
    document.getElementById(`edit-task-overlay${id}`).classList.remove('d-none');
    const form = document.getElementById(`edit-main-input-container${id}`);
    form.classList.replace('main-input-container', 'edit-main-input-container');
    ['input-border-container', 'at-alert-description', 'at-btn-container',
        'category-headline', 'category-input', 'at-subcategory-open', 'editDiv']
        .forEach(elementId => document.getElementById(elementId)?.classList.add('d-none'));
    document.querySelector('.right-left-container').style.display = 'block';
    removeTaskDetailElements();
}

/** Removes task-detail elements that are replaced by edit controls. */
function removeTaskDetailElements() {
    const selector = '.contactOverlay, .contactDiv, .subtaskOverlay, .checkBoxDiv, '
        + '.subtasksOverlay, .dateDiv, .prioDiv, .overlayTitle';
    document.querySelectorAll(selector).forEach(element => element.remove());
}

/** Binds the edit overlay save button to the active task. */
function bindEditSaveButton(id) {
    document.querySelector('.board-task-edit-btn')
        .addEventListener('click', () => saveTaskChanges(id), { once: true });
}

/** Marks the task's current assignees in the edit dropdown. */
function selectAssignedContacts(assignedContacts) {
    assignedContacts.forEach(contact => selectAssignedContact(contact.id || contact));
}

/** Selects one assigned contact in the edit dropdown. */
function selectAssignedContact(contactId) {
    const checkbox = document.querySelector(`input[data-contact-id="${contactId}"]`);
    if (!checkbox) return console.warn(`Checkbox with ID ${contactId} not found.`);
    checkbox.checked = true;
    checkbox.closest('.at-contact-layout')?.classList.add('is-selected');
}



/**
 * Renders the task data in the edit overlay.
 * @param {string} id - The ID of the task.
 * @param {string} taskTitle - The title of the task.
 * @param {string} taskDescription - The description of the task.
 * @param {string} taskDueDate - The due date of the task.
 * @param {string} taskPriority - The priority of the task.
 * @param {string} subtaskHTML - The HTML for the subtasks.
 * Ensure correct rendering before setting priority background
 * Assign the generated HTML or an empty string if there are no subtasks
 * Set the priority icon
 */
function renderEditTaskData(id, taskTitle, taskDescription, taskDueDate, taskPriority, subtaskHTML) {
    document.getElementById('task-title').value = taskTitle;
    document.getElementById('at-description').value = taskDescription;
    document.getElementById('task-due-date').value = taskDueDate;

    document.getElementById('added-subcategories').innerHTML = subtaskHTML;
    const priorityIcon = getPriorityIcon(taskPriority);
    const priorityIconElement = document.getElementById('priority-icon');
    if (priorityIconElement && priorityIcon) priorityIconElement.src = priorityIcon;
    requestAnimationFrame(() => setBackgroundColorPrio(taskPriority));
}

/**
 * Gets the selected priority level for a task.
 * @returns {string} The selected priority ('urgent', 'medium', or 'low').
 */
function getSelectedPriority() {
    const priorityElements = document.querySelectorAll('.at-prio-item');
    for (const element of priorityElements) {
        if (element.classList.contains('at-bg-urgent')) {
            return 'urgent';
        } else if (element.classList.contains('at-bg-medium')) {
            return 'medium';
        } else if (element.classList.contains('at-bg-low')) {
            return 'low';
        }
    }
    return 'low'; 
}

/**
 * Searches for tasks based on the input and filters them in the UI.
 * Select the containers for each category
 * Clear any existing "no results" messages
 * Track if matches are found for each section
 * Find the parent section of the card
 * Check each section and add "no results" message if needed
 */
function searchTasks() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    removeExistingNoResultsMessages();
    const matches = { triage: false, toDo: false, progress: false,
        feedback: false, done: false };
    document.querySelectorAll('.card').forEach(card => filterTaskCard(card, searchInput, matches));
    addSearchEmptyMessages(matches);
}

/** Shows a task card when title or description contains the search term. */
function filterTaskCard(card, searchInput, matches) {
    const title = card.querySelector('.cardTitle').textContent.toLowerCase();
    const description = card.querySelector('.cardContext').textContent.toLowerCase();
    const section = card.closest('#triage, #toDo, #progress, #feedback, #done');
    const isMatch = title.includes(searchInput) || description.includes(searchInput);
    card.style.display = isMatch ? 'block' : 'none';
    if (isMatch && section) matches[section.id] = true;
}

/** Adds a no-results message to every board column without a search match. */
function addSearchEmptyMessages(matches) {
    Object.entries(matches).forEach(([id, found]) => {
        if (!found) addNoResultsMessage(document.getElementById(id));
    });
}

/**
 * Removes any existing "no results" messages from the task containers.
 */
function removeExistingNoResultsMessages() {
    document.querySelectorAll('.no-results-message').forEach(message => message.remove());
}

/**
 * Adds a "no results" message to a specific container if no matching tasks are found.
 * @param {HTMLElement} container - The container element to which the message will be added.
 */
function addNoResultsMessage(container) {
    if (container) {
        // Create a new message element
        let noResultsMessage = document.createElement('div');
        noResultsMessage.classList.add('no-results-message');
        noResultsMessage.textContent = 'No matching tasks found';
        container.appendChild(noResultsMessage);
    }
}
