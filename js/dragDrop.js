/**
 * @type {string|null} - The ID of the currently dragged element.
 */
let currentDraggedElement = null;

/**
 * @type {number|null} - The initial X coordinate when dragging starts.
 */
let initialX = null;

/**
 * @type {number|null} - The initial Y coordinate when dragging starts.
 */
let initialY = null;

/**
 * @type {boolean} - Flag to indicate if an element is currently being dragged.
 */
let isDragging = false;

/**
 * @type {HTMLElement|null} - The visual clone of the dragged element.
 */
let dragClone = null;

const STATUS_CHANGE_WEBHOOK_URL =
    'https://julsino.app.n8n.cloud/webhook/join-status-change';

/**
 * Sends a successful task status change to the n8n notification workflow.
 * URL-encoded data avoids a CORS preflight for this public demo webhook.
 * Notification failures are logged without reverting the Firebase update.
 * @param {Object} task - The task whose status changed.
 * @param {string} oldStatus - Status before the move.
 * @param {string} newStatus - Status after the move.
 * @returns {Promise<void>}
 */
async function notifyTaskStatusChange(task, oldStatus, newStatus) {
    const payload = buildStatusChangePayload(task, oldStatus, newStatus);
    try {
        await sendStatusChangePayload(payload);
    } catch (error) {
        console.error('Status notification could not be sent:', error);
    }
}

/** Builds URL-encoded notification data for n8n. */
function buildStatusChangePayload(task, oldStatus, newStatus) {
    const creator = task.creator || {};
    return new URLSearchParams({
        taskId: task.id || '',
        title: task.title || 'Join-Ticket',
        oldStatus,
        newStatus,
        creatorName: creator.name || 'Stakeholder',
        creatorEmail: creator.email || '',
        creatorType: creator.type || 'internal',
    });
}

/** Sends encoded status data to the public n8n webhook. */
function sendStatusChangePayload(payload) {
    return fetch(STATUS_CHANGE_WEBHOOK_URL, {
        method: 'POST', mode: 'no-cors', keepalive: true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString(),
    });
}

/**
 * Persists a changed status and then triggers the creator notification.
 * @param {Object} task - Task to update.
 * @param {string} newStatus - Destination column ID.
 * @returns {Promise<void>}
 */
async function updateTaskStatus(task, newStatus) {
    const oldStatus = task.status;
    if (oldStatus === newStatus) return;

    await changeTask(`/task/${task.id}/status`, newStatus);
    task.status = newStatus;
    await notifyTaskStatusChange(task, oldStatus, newStatus);
}


/**
 * Initializes event listeners for scrolling containers once the DOM is loaded.
 * Get the container's dimensions and position
 * Adjust these values to control the scrolling speed and sensitivity
 * Calculate mouse position relative to the container
 * Mouse is within the left margin, scroll left or right
 */
document.addEventListener('DOMContentLoaded', () => {
    // Select all .taskContent elements
    const scrollContainers = document.querySelectorAll('.taskContent');


    const scrollSpeed = 5;
    const scrollMargin = 0.3;

    scrollContainers.forEach(container => {
        container.addEventListener('mousemove', (event) => {

            const rect = container.getBoundingClientRect();
            const containerWidth = rect.width;
            const containerLeft = rect.left;


            const mouseX = event.clientX - containerLeft;


            const leftMargin = containerWidth * scrollMargin;
            const rightMargin = containerWidth * (1 - scrollMargin);

            if (mouseX < leftMargin) {

                container.scrollLeft -= scrollSpeed * (leftMargin - mouseX) / leftMargin;
            } else if (mouseX > rightMargin) {

                container.scrollLeft += scrollSpeed * (mouseX - rightMargin) / (containerWidth - rightMargin);
            }
        });
    });
});

/**
 * Stops the propagation of the event to parent elements.
 * @param {Event} event - The event to stop propagation for.
 */
function stopPropagation(event) {
    event.stopPropagation();
}
/**
 * Sets the ID of the task that is currently being dragged.
 * @param {string} taskId - The ID of the task being dragged.
 */
function startDragging(taskId) {
    const task = tasks.find(taskItem => taskItem.id === taskId);
    currentDraggedElement = canCurrentUserModifyTask(task) ? taskId : null;
}

/**
 * Allows dropping by preventing the default behavior of the event.
 * @param {DragEvent} event - The drag event.
 */
function allowDrop(event) {
    event.preventDefault();
}

/**
 * Handles the drop event by appending the dragged task to the drop zone and updating its status.
 * @async
 * @param {DragEvent} event - The drag event.
 * Append the task to the drop zone
 * Re-render tasks to reflect changes
 */
async function drop(event) {
    event.preventDefault();
    const dropZone = event.target.closest('.taskContent');
    await moveDraggedTask(dropZone);
}

/**
 * Handles the drop event on mobile devices by appending the dragged task to the drop zone and updating its status.
 * @async
 * @param {TouchEvent} event - The touch event.
 * Get touch coordinates
 * Update the task's status based on the drop zone ID
 * Re-render tasks to reflect changes
 */
async function dropMobile(event) {
    const touch = event.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    await moveDraggedTask(target?.closest('.taskContent'));
}

/** Moves the currently dragged task into a board column. */
async function moveDraggedTask(dropZone) {
    const task = tasks.find(item => item.id === currentDraggedElement);
    if (!canCurrentUserModifyTask(task) || !dropZone) return;
    const taskElement = document.querySelector(`[data-id="${currentDraggedElement}"]`);
    if (!taskElement) return console.error('Task element not found:', currentDraggedElement);
    dropZone.appendChild(taskElement);
    await updateTaskStatus(task, dropZone.id);
    await loadDataTask();
    renderTasks();
}

/**
 * Handles the start of a touch event by setting the dragged element and creating a visual clone.
 * @param {TouchEvent} event - The touch event.
 */
document.addEventListener('touchstart', (event) => {
    const card = event.target.closest('.card');
    if (card) {
        const task = tasks.find(taskItem => taskItem.id === card.dataset.id);
        if (!canCurrentUserModifyTask(task)) return;
        currentDraggedElement = card.dataset.id;
        initialX = event.touches[0].clientX;
        initialY = event.touches[0].clientY;
        isDragging = false;


        dragClone = card.cloneNode(true);
        dragClone.style.position = 'absolute';
        dragClone.style.pointerEvents = 'none';
        document.body.appendChild(dragClone);
    }
}, { passive: true });

/**
 * Handles the movement of a touch event by updating the visual clone's position and determining if dragging is in progress.
 * @param {TouchEvent} event - The touch event.
 *  Horizontal movement detected, let the user scroll 
 *  Vertical movement detected, start dragging Prevent scrolling
 *  Update the clone's position to follow the touch
 *  Prevent scrolling when dragging, only if the event is cancelable
 */
document.addEventListener('touchmove', (event) => {
    if (initialX === null || initialY === null) return;

    let currentX = event.touches[0].clientX;
    let currentY = event.touches[0].clientY;

    let diffX = currentX - initialX;
    let diffY = currentY - initialY;

    if (Math.abs(diffX) > Math.abs(diffY)) {

        isDragging = false;

        if (dragClone) {
            document.body.removeChild(dragClone);
            dragClone = null;
        }
        
        currentDraggedElement = null;
    } else {
        
        if (!event.cancelable) return;

        event.preventDefault(); 

        
        if (!isDragging) {
            isDragging = true;

            
            if (dragClone === null) {
                const card = document.querySelector(`[data-id="${currentDraggedElement}"]`);
                if (card) {
                    dragClone = card.cloneNode(true);
                    dragClone.style.position = 'absolute';
                    dragClone.style.pointerEvents = 'none';
                    document.body.appendChild(dragClone);
                }
            }
        }

        
        if (dragClone) {
            dragClone.style.left = `${currentX}px`;
            dragClone.style.top = `${currentY}px`;
        }
    }
}, { passive: false });




/**
 * Handles the end of a touch event by dropping the task if dragging was in progress and removing the visual clone.
 * @param {TouchEvent} event - The touch event.
 * Remove the clone
 * Reset initial positions
 */
document.addEventListener('touchend', async (event) => {
    if (isDragging) {
        await dropMobile(event);
    }

    
    if (dragClone) {
        document.body.removeChild(dragClone);
        dragClone = null;
    }

    
    initialX = null;
    initialY = null;
    isDragging = false;
}, { passive: true });
