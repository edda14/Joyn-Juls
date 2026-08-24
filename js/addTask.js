let contactColors = {};
let categoryChoosedIndex = 'false';
let categoryChoosed = '';
let subcategoriesChoosed = [];
let subtaskCompleted = [];
let choosedContacts = [];
let taskPrio = '';
let task = [];

/** Initializes all controls and data used by the task form. */
async function addTaskInit() {
    await includeHTML();
    await loadDataContacts();
    await renderAssignedToContacts();
    showAvailableContacts();
    showCategoryList();
    showInitials();
    setupContactSearchPlaceholder();
    setupSubcategoryControls();
    setBackgroundColorPrio('medium');
}

/** Binds the legacy assigned-contact dropdown toggle. */
function setupDropdownToggle() {
    const selectedElement = document.querySelector('.select-selected');
    const dropdownContainer = document.getElementById('at-contact-container');

    // Toggle dropdown when the select is clicked
    selectedElement.addEventListener('click', function (event) {
        event.stopPropagation();  // Prevent click from propagating and triggering the document click listener
        this.classList.toggle('select-arrow-active');
        dropdownContainer.classList.toggle('select-hide');
    });

    // Handle outside clicks to close the dropdown
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.custom-select') && !event.target.closest('.select-items')) {
            dropdownContainer.classList.add('select-hide');
            selectedElement.classList.remove('select-arrow-active');
        }
    });
}


/** Renders all contacts into each assignment dropdown. */
async function renderAssignedToContacts() {
    let contentCollection = document.getElementsByClassName('select-items');

    // Iteriere über die HTMLCollection, um jedes Element zu bearbeiten
    for (let j = 0; j < contentCollection.length; j++) {
        let content = contentCollection[j];
        content.innerHTML = '';  // Leere den Inhalt des Containers

        for (let i = 0; i < contacts.length; i++) {
            const contactName = contacts[i].name;
            let initials = contacts[i].initials;
            let color = contacts[i].profileColor;
            let id = contacts[i].id;

            // Generiere HTML für jeden Kontakt
            content.innerHTML += generateAssignedContactsHTML(initials, contactName, id, color);
        }
    }
}

/** Filters the assignment list by the entered contact name. */
function filterContacts() {
    const searchInput = document.getElementById('contact-search');
    if (!searchInput) return reportMissingContactElement('contact-search');
    const searchValue = searchInput.value.toLowerCase();
    const filteredContacts = contacts.filter(contact => contact.name.toLowerCase().includes(searchValue));
    const container = document.getElementById('at-contact-container');
    if (!container) return reportMissingContactElement('at-contact-container');
    container.innerHTML = filteredContacts.map(contactToAssignmentHTML).join('');
    filteredContacts.forEach(contact => updateCheckboxState(contact.id));
}

/** Reports a missing assignment control without stopping the page. */
function reportMissingContactElement(id) {
    console.error(`Element mit der ID "${id}" wurde nicht gefunden.`);
}

/** Converts one contact into assignment-list HTML. */
function contactToAssignmentHTML(contact) {
    return generateAssignedContactsHTML(
        contact.initials, contact.name, contact.id, contact.profileColor);
}


/** Adds a contact to the current task selection. */
function addContactToTask(initials, id, color) {
    // Überprüfe, ob der Kontakt bereits in der Liste ist
    let index = choosedContacts.findIndex(contact => contact.id === id);

    if (index === -1) {
        // Kontakt ist noch nicht ausgewählt, füge ihn hinzu
        choosedContacts.push({
            id: id,
            initial: initials,
            color: color,
        });
    }

    showChoosedContacts(); // Zeige die ausgewählten Kontakte an
    updateCheckboxState(id); // Aktualisiere den Zustand der Checkboxen
}

/** Removes a contact from the current task selection. */
function removeContactFromTask(id) {
    // Entferne den Kontakt aus der Liste der ausgewählten Kontakte
    choosedContacts = choosedContacts.filter(contact => contact.id !== id);

    showChoosedContacts(); // Zeige die ausgewählten Kontakte an
    updateCheckboxState(id); // Aktualisiere den Zustand der Checkboxen
}


/** Synchronizes all checkboxes for one contact. */
function updateCheckboxState(contactId) {
    const checkboxes = document.querySelectorAll(`input[data-contact-id="${contactId}"]`);
    checkboxes.forEach(checkbox => {
        const isSelected = choosedContacts.some(contact => contact.id === contactId);
        checkbox.checked = isSelected;
        checkbox.closest('.at-contact-layout')?.classList.toggle('is-selected', isSelected);
    });
}


/** Renders avatars for the currently selected contacts. */
function showChoosedContacts() {
    let content = document.getElementById('at-selected-contacts');
    content.innerHTML = '';  // Leere den Bereich, bevor du neue Inhalte hinzufügst
    
    for (let i = 0; i < choosedContacts.length; i++) {
        let contact = choosedContacts[i].initial;
        let color = choosedContacts[i].color;
        
        // Zeige ausgewählte Kontakte mit ihren Farben und Initialen an
        content.innerHTML += `<div class="at-choosed-contact-shortcut" id="at-choosed-shortcut${i}">
                                <div class="at-contact-shortcut">${contact}</div>
                              </div>`;
        
        // Setze den Hintergrund für die Kontakte
        let backgroundColor = document.getElementById(`at-choosed-shortcut${i}`);
        backgroundColor.style.backgroundColor = color;
    }
}


/** Initializes all assignment dropdowns. */
function showAvailableContacts() {
    const customSelects = document.querySelectorAll('.custom-select');

    customSelects.forEach(select => {
        const selectSelected = select.querySelector('.select-selected');
        const selectItems = select.querySelector('.select-items');
        closeContactDropdown(selectItems);
        if (select.dataset.contactDropdownBound === 'true') return;
        select.dataset.contactDropdownBound = 'true';
        showContactList(selectSelected, selectItems, customSelects);
        bindContactOutsideClick(select, selectItems);
    });
}

/** Closes an assignment dropdown and restores its arrow icon. */
function closeContactDropdown(selectItems) {
    selectItems.style.display = 'none';
    selectItems.classList.add('select-hide');
    document.getElementById('open-contact-list')?.classList.remove('d-none');
    document.getElementById('close-contact-list')?.classList.add('d-none');
}

/** Closes an assignment dropdown when the user clicks elsewhere. */
function bindContactOutsideClick(select, selectItems) {
    document.addEventListener('click', event => {
        if (!select.contains(event.target)) closeContactDropdown(selectItems);
    }, true);
}

/** Handles a click on an assignment-list contact. */
function handleContactSelection(event, contactId) {
    event.preventDefault();
    event.stopPropagation();
    toggleCheckbox(contactId);
}

/** Toggles one assigned contact and keeps its visual state in sync. */
function toggleCheckbox(contactId) {
    const checkbox = document.querySelector(`input[data-contact-id="${contactId}"]`);

    if (!checkbox) return;

    checkbox.checked = !checkbox.checked;
    const selectedContact = contacts.find(contact => contact.id === contactId);
    const contactLayout = checkbox.closest('.at-contact-layout');
    updateContactSelection(checkbox.checked, selectedContact, contactLayout);
}

/** Applies a checked or unchecked contact selection. */
function updateContactSelection(isSelected, contact, layout) {
    if (isSelected) addContactToTask(contact.initials, contact.id, contact.profileColor);
    else removeContactFromTask(contact.id);
    layout?.classList.toggle('is-selected', isSelected);
}



/** Binds opening and closing of an assignment dropdown. */
function showContactList(selectSelected, selectItems, customSelects) {
    selectSelected.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevents closing the dropdown on this click
        const shouldOpen = selectItems.classList.contains('select-hide');

        customSelects.forEach(select => closeContactDropdown(select.querySelector('.select-items')));
        if (shouldOpen) openContactDropdown(selectItems);
    });
}

/** Opens an assignment dropdown and switches its arrow icon. */
function openContactDropdown(selectItems) {
    selectItems.classList.remove('select-hide');
    selectItems.style.display = 'block';
    document.getElementById('open-contact-list')?.classList.add('d-none');
    document.getElementById('close-contact-list')?.classList.remove('d-none');
}


/** Selects or deselects a task priority. */
function setBackgroundColorPrio(prio) {
    let prioStatus = document.getElementById(prio);
    let prioImgDeactive = document.getElementById(`${prio}-img-deactive`);
    let prioImgActive = document.getElementById(`${prio}-img-active`);
    resetOtherPriorities(prio);

    if (prioStatus.classList.contains(`at-bg-${prio}`)) {
        removeBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive);
        taskPrio = '';
    } else {
        addBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive);
        taskPrio = prio;
    }
}

/** Applies the active appearance to a priority button. */
function addBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive) {
    prioStatus.classList.add(`at-bg-${prio}`);
    prioImgDeactive.style.display = 'none';
    prioImgActive.style.display = 'block';
}

/** Restores the inactive appearance of a priority button. */
function removeBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive) {
    prioStatus.classList.remove(`at-bg-${prio}`);
    prioImgDeactive.style.display = 'block';
    prioImgActive.style.display = 'none';
}

/** Deselects every priority except the supplied value. */
function resetOtherPriorities(selectedPrio) {
    const priorities = ['urgent', 'medium', 'low'];
    priorities.forEach(prio => {
        if (prio !== selectedPrio) {
            let prioStatus = document.getElementById(prio);
            let prioImgDeactive = document.getElementById(`${prio}-img-deactive`);
            let prioImgActive = document.getElementById(`${prio}-img-active`);
            removeBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive);
        }
    });
}

/** Initializes all category dropdowns. */
function showCategoryList() {
    let customSelects = document.querySelectorAll('.custom-category-select');
    customSelects.forEach(function (select) {
        let selectSelected = select.querySelector('.select-category-selected');
        let selectItems = select.querySelector('.select-category-items');
        let options = selectItems.querySelectorAll('.at-contact-layout');
        if (select.dataset.categoryDropdownBound === 'true') return;
        select.dataset.categoryDropdownBound = 'true';
        showCategoryDropdown(selectSelected, selectItems);
        chooseCategoryFromList(options, selectSelected, selectItems);
        window.addEventListener('click', event => {
            if (!select.contains(event.target)) closeCategoryDropdown(selectItems);
        });
    });
}

/** Closes the category list and restores its arrow icon. */
function closeCategoryDropdown(selectItems) {
    selectItems.style.display = 'none';
    document.getElementById('open-category-list')?.classList.remove('d-none');
    document.getElementById('close-category-list')?.classList.add('d-none');
}

/** Binds category-dropdown visibility controls. */
function showCategoryDropdown(selectSelected, selectItems) {
    selectSelected.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevents the event from closing the dropdown immediately
        if (selectItems.style.display === 'block') closeCategoryDropdown(selectItems);
        else openCategoryDropdown(selectItems);
    });
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.custom-category-select')) closeCategoryDropdown(selectItems);
    });
}

/** Opens the category list and switches its arrow icon. */
function openCategoryDropdown(selectItems) {
    selectItems.style.display = 'block';
    document.getElementById('open-category-list')?.classList.add('d-none');
    document.getElementById('close-category-list')?.classList.remove('d-none');
}


/** Resets the selected category and closes its dropdown. */
function clearCategoryDropdown() {
    let customSelects = document.querySelectorAll('.custom-category-select');
    customSelects.forEach(function (select) {
        let selectSelected = select.querySelector('.select-category-selected');
        let selectItems = select.querySelector('.select-category-items');
        const selectedLabel = selectSelected.querySelector('div');
        if (selectedLabel) selectedLabel.textContent = 'Select task category';
        selectItems.style.display = 'none';
        categoryChoosedIndex = 'false';
        categoryChoosed = '';
        let openIcon = document.getElementById('open-category-list');
        let closeIcon = document.getElementById('close-category-list');
        if (openIcon && closeIcon) {
            openIcon.classList.remove('d-none');
            closeIcon.classList.add('d-none');
        }
    });
}

/** Binds each category option to the form selection. */
function chooseCategoryFromList(options, selectSelected, selectItems) {
    options.forEach(function (option) {
        option.addEventListener('click', function () {
            const selectedCategory = option.querySelector('.at-contact-name').textContent;
            const selectedLabel = selectSelected.querySelector('div');
            if (selectedLabel) selectedLabel.textContent = selectedCategory;
            selectItems.style.display = 'none';
            categoryChoosedIndex = 'true';
            categoryChoosed = selectedCategory;
            document.getElementById('open-category-list')?.classList.remove('d-none');
            document.getElementById('close-category-list')?.classList.add('d-none');
            checkIfCategoryEmpty();
        });
    });
}

/** Validates all required task fields. */
function checkRequiredInput() {
    let isTitleValid = checkIfTitleEmpty();
    let isDateValid = checkIfDateEmpty();
    let isCategoryValid = checkIfCategoryEmpty();

    return isTitleValid && isDateValid && isCategoryValid;
}

/** Validates the task title input. */
function checkIfTitleEmpty() {
    let title = document.getElementById('task-title');
    if (title.value === '') {
        document.getElementById('at-alert-title').classList.remove('d-none');
        title.style.borderColor = '#FF8190';
        return false;
    }
    else {
        document.getElementById('at-alert-title').classList.add('d-none');
        title.style.borderColor = '';
        return true;
    }
}

/** Validates the due-date input. */
function checkIfDateEmpty() {
    let date = document.getElementById('task-due-date');

    if (date.value === '') {
        document.getElementById('at-alert-due-date').classList.remove('d-none');
        date.style.borderColor = '#FF8190';
        return false;
    }
    else {
        document.getElementById('at-alert-due-date').classList.add('d-none');
        date.style.borderColor = '';
        return true;
    }
}

/** Validates the task category selection. */
function checkIfCategoryEmpty() {
    let category = document.getElementById('category-input');
    if (categoryChoosedIndex === 'false') {
        document.getElementById('at-alert-category').classList.remove('d-none');
        category.style.borderColor = '#FF8190';
        return false;
    }
    else {
        document.getElementById('at-alert-category').classList.add('d-none');
        category.style.borderColor = '';
        return true;

    }
}

/** Activates the new-subtask input controls. */
function activateSubcategory() {
    let inputField = document.getElementById('add-subcategory');
    if (document.getElementById('at-subcategory-clear').classList.contains('d-none')) {
        document.getElementById('at-subcategory-clear').classList.remove('d-none');
        document.getElementById('at-subcategory-border').classList.remove('d-none');
        document.getElementById('at-subcategory-confirm').classList.remove('d-none');
        document.getElementById('at-subcategory-open').classList.add('d-none');
    }
    inputField.focus();
}

/** Restores the inactive new-subtask controls. */
function deactivateSubcategory() {
    document.getElementById('at-subcategory-clear')?.classList.add('d-none');
    document.getElementById('at-subcategory-border')?.classList.add('d-none');
    document.getElementById('at-subcategory-confirm')?.classList.add('d-none');
    document.getElementById('at-subcategory-open')?.classList.remove('d-none');
}

/** Binds mouse and keyboard controls for creating subtasks. */
function setupSubcategoryControls() {
    const input = document.getElementById('add-subcategory');
    const container = input?.closest('.at-input-container');
    const openButton = document.getElementById('at-subcategory-open');
    if (!input || !container || container.dataset.subcategoryBound === 'true') return;

    container.dataset.subcategoryBound = 'true';
    openButton?.addEventListener('click', event => {
        event.stopPropagation();
        activateSubcategory();
    });
    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        renderSubcategory();
    });
}

/** Clears the new-subtask input without closing the task overlay. */
function clearInputSubcategory(event) {
    let inputField = document.getElementById('add-subcategory');
    event.stopPropagation();
    inputField.value = '';
}

/** Adds a pending subtask and renders all selected subtasks. */
function renderSubcategory() {
    let content = document.getElementById('added-subcategories');
    const input = document.getElementById('add-subcategory');
    if (input.value !== '') {
        subcategoriesChoosed.push(input.value);
        subtaskCompleted.push('false');
        input.value = '';
        deactivateSubcategory();
    }
    content.innerHTML = subcategoriesChoosed.map(getSubcategoryEditorHTML).join('');
}

/** Returns editable HTML for one selected subtask. */
function getSubcategoryEditorHTML(choosedSubcategorie, i) {
    return /*html*/`
        <div class="choosed-subcategorie-container">
            <input class="choosed-subcategory-input" value="${choosedSubcategorie}" id="choosed-subcategory-${i}">
            <div class="choosed-subcategorie-btn-container">
                <img onclick="focusInput('choosed-subcategory-${i}')" class="at-choosed-subcategory-edit" src="assets/img/editDark.png" id="at-choosed-subcategory-edit-${i}">
                <div class="small-border-container"></div>
                <img onclick="removeSubcategory(${i})" class="at-choosed-subcategory-delete" src="assets/img/delete.png" id="at-choosed-subcategory-delete-${i}">
            </div>
            <div class="choosed-subcategorie-btn-container-active-field">
                <img onclick="removeSubcategory(${i})" class="at-choosed-subcategory-delete" src="assets/img/delete.png" id="at-choosed-subcategory-delete-active-${i}">
                <div class="small-border-container-gray"></div>
                <img class="at-choosed-subcategory-check" src="assets/img/checkOkDarrk.png" id="at-choosed-subcategory-check-active-${i}">
            </div>
        </div>`;
}

/** Removes every selected subtask. */
function removeAllSubcategory() {
    subcategoriesChoosed.splice(subcategoriesChoosed.length);
    renderSubcategory();
}

/** Focuses one editable subtask input. */
function focusInput(inputId) {
    document.getElementById(inputId).focus();
}

/** Removes a selected subtask by index. */
function removeSubcategory(i) {
    subcategoriesChoosed.splice(i, 1);
    subtaskCompleted.splice(i, 1);
    renderSubcategory();
}

/** Resets the complete task form. */
function clearTask() {
    let title = document.getElementById('task-title');
    let description = document.getElementById('at-description');
    let date = document.getElementById('task-due-date');

    title.value = '';
    description.value = '';
    choosedContacts = [];
    date.value = '';
    taskPrio = '';
    categoryChoosed = '';
    subcategoriesChoosed = [];
    renderAssignedToContacts();
    showChoosedContacts();
    showAvailableContacts();
    clearCategoryDropdown();
    renderSubcategory();
    resetOtherPriorities('reset');
}

/** Shows task-created feedback and navigates to the Board. */
function goToBoard() {
    let bgAddedNote = document.getElementById('bg-task-added-note');
    bgAddedNote.style.zIndex = 100;
    let addedNote = document.getElementById('task-added-note');
    addedNote.classList.add('confirmation-task-creation-shown');
    setTimeout(function () {
        window.location.href = './board.html';
    }, 2000);
}

/** Hides the custom contact-search placeholder while typing. */
function setupContactSearchPlaceholder() {
    const searchInput = document.getElementById('contact-search');
    const originalPlaceholder = document.getElementById('original-placeholder');

    if (!searchInput || !originalPlaceholder) return reportMissingSearchPlaceholder();
    searchInput.addEventListener('focus', () => originalPlaceholder.style.display = 'none');
    searchInput.addEventListener('blur', function() {
        if (this.value === '') originalPlaceholder.style.display = 'block';
    });
}

/** Reports absent contact-search placeholder elements. */
function reportMissingSearchPlaceholder() {
    console.error('Elemente "contact-search" oder "original-placeholder" wurden nicht gefunden.');
}
