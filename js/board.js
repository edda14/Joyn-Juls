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
    const columns = {
        triage: document.getElementById('triage'),
        toDo: document.getElementById('toDo'),
        progress: document.getElementById('progress'),
        feedback: document.getElementById('feedback'),
        done: document.getElementById('done')
    };

    
    Object.values(columns).forEach(column => column.innerHTML = '');

    tasks.forEach((task, i) => {
        const { id, subcategory, completedSubtasks, assignedTo, category, prio, status } = task;

        let subtaskHTML = getSubtask(task);
        let editSubtask = getEditSubtaskHTML(subcategory);
        let completedCount = completedSubtasks.filter(completed => completed === 'true').length;
        let taskAssignee = getTaskAssignee(assignedTo);
        let taskPriorityIcon = getPriorityIcon(prio);
        let taskTypeBackgroundColor = category === 'User Story' ? '#1FD7C1' : '';

        
        let newTask = document.createElement('div');
        newTask.innerHTML = getTaskTemplate(task, i, taskTypeBackgroundColor, category, taskAssignee, taskPriorityIcon, completedCount, editSubtask, id, subtaskHTML);

        
        newTask.addEventListener('click', event => {
            event.stopPropagation();
            showOverlay1(task.title, task.description, task.date, prio, assignedTo, category, subtaskHTML, id, editSubtask, task.creator, task.aiGenerated);
        });

        
        let targetColumn = columns[status] || columns.triage;
        targetColumn.appendChild(newTask);

        
        updateProgressBar(completedCount, subcategory.length, i);
    });

    checkIfEmpty(); 
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

    let taskPriorityIcon = getPriorityIcon(taskPriority);
    let taskTypeBackgroundColor = taskType === 'User Story' ? '#1FD7C1' : '';
    let assigneeOverlayContent = Array.isArray(taskAssignees) && taskAssignees.length > 0
        ? taskAssignees.map(assignee => {
            let contact = contacts.find(contact => contact.id === assignee.id);
            return contact ? `
                <div class="contactDiv">
                    <span class="contactCard" style="background-color: ${assignee.color};"> ${assignee.initial}</span>
                    <span class="contactName">${getContactDisplayName(contact)}</span>
                </div>
            ` : '';
        }).join('')
        : '';

    // Use the template function to get the HTML string
    const templateHTML = getOverlayTemplate(
        taskTitle,
        taskDescription,
        taskDueDate,
        taskPriority,
        taskPriorityIcon,
        taskType,
        taskTypeBackgroundColor,
        assigneeOverlayContent,
        subtaskHTML,
        id,
        taskCreator,
        aiGenerated
    );

    // Insert the generated HTML into the overlay content
    overlayContent.innerHTML = templateHTML;

    overlay.style.display = "flex";
    overlayContent.style.transform = "translateX(0)";
    overlayContent.style.opacity = "1";
    await includeHTML();
    showInitials();
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

    if (task) {
        const { title, description, date, prio, subcategory, assignedTo } = task;
        subcategoriesChoosed = [...subcategory];

        await addTaskInit();
        document.getElementById(`edit-task-overlay${id}`).classList.remove('d-none');
        document.getElementById(`edit-main-input-container${id}`).classList.remove('main-input-container');
        document.getElementById(`edit-main-input-container${id}`).classList.add('edit-main-input-container');
        document.getElementById('input-border-container').classList.add('d-none');
        document.getElementById('at-alert-description').classList.add('d-none');
        document.getElementById('at-btn-container').classList.add('d-none');
        document.getElementById('category-headline').classList.add('d-none');
        document.getElementById('category-input').classList.add('d-none');
        document.getElementById('at-subcategory-open').classList.add('d-none');
        document.getElementById('editDiv').classList.add('d-none');
        var element = document.querySelector('.right-left-container');
        element.style.display = 'block';

        
        const elementsToRemove = document.querySelectorAll('.contactOverlay, .contactDiv, .subtaskOverlay, .checkBoxDiv, .subtasksOverlay, .dateDiv, .prioDiv, .overlayTitle');
        elementsToRemove.forEach(element => {
            element.remove(); 
        });

        const saveButton = document.querySelector('.board-task-edit-btn');
        saveButton.addEventListener('click', () => saveTaskChanges(id));

        const assignedContacts = assignedTo || []; 
        assignedContacts.forEach(contact => {
           
            const contactId = contact.id || contact; 

            const checkbox = document.querySelector(`input[data-contact-id="${contactId}"]`);
            if (checkbox) {
                checkbox.checked = true; 
                const contactLayout = checkbox.closest('.at-contact-layout');
                if (contactLayout) {
                    contactLayout.style.backgroundColor = '#2a3647e0';
                    contactLayout.style.color = 'white';
                }
            } else {
                console.warn(`Checkbox with ID ${contactId} not found.`);
            }
        });
        
        const subtaskHTML = Array.isArray(subcategory) ? getEditSubtaskHTML(subcategory) : '';

        renderEditTaskData(id, title, description, date, prio, subtaskHTML);
    } else {
        console.error('Task not found');
    }
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

    if (priorityIconElement && priorityIcon) {
        priorityIconElement.src = priorityIcon;
    }

    
    requestAnimationFrame(() => {
        setBackgroundColorPrio(taskPriority);
    });
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
    let searchInput = document.getElementById('searchInput').value.toLowerCase();
    let taskCards = document.querySelectorAll('.card');

    
    let triageContainer = document.getElementById('triage');
    let toDoContainer = document.getElementById('toDo');
    let progressContainer = document.getElementById('progress');
    let feedbackContainer = document.getElementById('feedback');
    let doneContainer = document.getElementById('done');

    
    removeExistingNoResultsMessages();

    
    let matchesFound = {
        triage: false,
        toDo: false,
        progress: false,
        feedback: false,
        done: false
    };

    taskCards.forEach(card => {
        let taskTitle = card.querySelector('.cardTitle').textContent.toLowerCase();
        let taskDescription = card.querySelector('.cardContext').textContent.toLowerCase();

        
        let parentSection = card.closest('#triage, #toDo, #progress, #feedback, #done');

        if (taskTitle.includes(searchInput) || taskDescription.includes(searchInput)) {
            card.style.display = 'block'; 

            
            if (parentSection) {
                if (parentSection.id === 'triage') matchesFound.triage = true;
                if (parentSection.id === 'toDo') matchesFound.toDo = true;
                if (parentSection.id === 'progress') matchesFound.progress = true;
                if (parentSection.id === 'feedback') matchesFound.feedback = true;
                if (parentSection.id === 'done') matchesFound.done = true;
            }
        } else {
            card.style.display = 'none'; 
        }
    });

    
    if (!matchesFound.triage) addNoResultsMessage(triageContainer);
    if (!matchesFound.toDo) addNoResultsMessage(toDoContainer);
    if (!matchesFound.progress) addNoResultsMessage(progressContainer);
    if (!matchesFound.feedback) addNoResultsMessage(feedbackContainer);
    if (!matchesFound.done) addNoResultsMessage(doneContainer);
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
