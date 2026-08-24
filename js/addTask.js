let contactColors = {};
let categoryChoosedIndex = 'false';
let categoryChoosed = '';
let subcategoriesChoosed = [];
let subtaskCompleted = [];
let choosedContacts = [];
let taskPrio = '';
let task = [];

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

function filterContacts() {
    const searchInput = document.getElementById('contact-search'); // Corrected to use 'id' instead of 'class'
    if (!searchInput) {
        console.error('Element mit der ID "contact-search" wurde nicht gefunden.');
        return;
    }

    const searchValue = searchInput.value.toLowerCase();
    const filteredContacts = contacts.filter(contact => contact.name.toLowerCase().includes(searchValue));

    const contactContainer = document.getElementById('at-contact-container'); // Ensure correct container is used
    if (!contactContainer) {
        console.error('Element mit der ID "at-contact-container" wurde nicht gefunden.');
        return;
    }

    contactContainer.innerHTML = ''; // Clear the previous results

    filteredContacts.forEach(contact => {
        // Generate the contact HTML
        contactContainer.innerHTML += generateAssignedContactsHTML(contact.initials, contact.name, contact.id, contact.profileColor);
    });

    // After filtering, update the checkbox states
    filteredContacts.forEach(contact => {
        updateCheckboxState(contact.id);
    });
}


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

function removeContactFromTask(id) {
    // Entferne den Kontakt aus der Liste der ausgewählten Kontakte
    choosedContacts = choosedContacts.filter(contact => contact.id !== id);

    showChoosedContacts(); // Zeige die ausgewählten Kontakte an
    updateCheckboxState(id); // Aktualisiere den Zustand der Checkboxen
}


function updateCheckboxState(contactId) {
    const checkboxes = document.querySelectorAll(`input[data-contact-id="${contactId}"]`);
    checkboxes.forEach(checkbox => {
        const isSelected = choosedContacts.some(contact => contact.id === contactId);
        checkbox.checked = isSelected;
        checkbox.closest('.at-contact-layout')?.classList.toggle('is-selected', isSelected);
    });
}


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


function showAvailableContacts() {
    const customSelects = document.querySelectorAll('.custom-select');

    customSelects.forEach(select => {
        const selectSelected = select.querySelector('.select-selected');
        const selectItems = select.querySelector('.select-items');
        // Hide the contact list by default
        selectItems.style.display = 'none';
        selectItems.classList.add('select-hide');

        if (select.dataset.contactDropdownBound === 'true') return;
        select.dataset.contactDropdownBound = 'true';

        // Handle showing contact list and selection
        showContactList(selectSelected, selectItems, customSelects);

        // Capture the click before other form controls can stop propagation.
        document.addEventListener('click', function (event) {
            if (!select.contains(event.target)) {
                selectItems.style.display = 'none';
                selectItems.classList.add('select-hide');
                document.getElementById('open-contact-list')?.classList.remove('d-none');
                document.getElementById('close-contact-list')?.classList.add('d-none');
            }
        }, true);
    });
}

function handleContactSelection(event, contactId) {
    event.preventDefault();
    event.stopPropagation();
    toggleCheckbox(contactId);
}

function toggleCheckbox(contactId) {
    const checkbox = document.querySelector(`input[data-contact-id="${contactId}"]`);

    if (!checkbox) return;

    // Toggle checkbox state
    checkbox.checked = !checkbox.checked;

    // Find the contact by ID
    const selectedContact = contacts.find(contact => contact.id === contactId);

    // Find the closest parent with the class 'at-contact-layout'
    const contactLayout = checkbox.closest('.at-contact-layout');

    // Keep the list open so several contacts can be selected in one go.
    if (checkbox.checked) {
        addContactToTask(selectedContact.initials, contactId, selectedContact.profileColor);
        contactLayout?.classList.add('is-selected');
    } else {
        removeContactFromTask(contactId);
        contactLayout?.classList.remove('is-selected');
    }
}



function showContactList(selectSelected, selectItems, customSelects) {
    selectSelected.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevents closing the dropdown on this click
        const shouldOpen = selectItems.classList.contains('select-hide');

        customSelects.forEach(function (s) {
            const items = s.querySelector('.select-items');
            items.style.display = 'none';
            items.classList.add('select-hide');
        });

        if (shouldOpen) {
            selectItems.classList.remove('select-hide');
            selectItems.style.display = 'block';
        }

        // Toggle the icons accordingly
        if (shouldOpen) {
            document.getElementById('open-contact-list').classList.add('d-none');
            document.getElementById('close-contact-list').classList.remove('d-none');
        } else {
            document.getElementById('open-contact-list').classList.remove('d-none');
            document.getElementById('close-contact-list').classList.add('d-none');
        }
    });

}


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

function addBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive) {
    prioStatus.classList.add(`at-bg-${prio}`);
    prioImgDeactive.style.display = 'none';
    prioImgActive.style.display = 'block';
}

function removeBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive) {
    prioStatus.classList.remove(`at-bg-${prio}`);
    prioImgDeactive.style.display = 'block';
    prioImgActive.style.display = 'none';
}

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
        window.addEventListener('click', function (e) {
            if (!select.contains(e.target)) {
                selectItems.style.display = 'none';
                let openIcon = document.getElementById('open-category-list');
                let closeIcon = document.getElementById('close-category-list');
                if (openIcon && closeIcon) {
                    openIcon.classList.remove('d-none');
                    closeIcon.classList.add('d-none');
                }
            }
        });
    });
}

function showCategoryDropdown(selectSelected, selectItems) {
    selectSelected.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevents the event from closing the dropdown immediately
        // Toggle dropdown visibility
        if (selectItems.style.display === 'block') {
            selectItems.style.display = 'none';
            document.getElementById('open-category-list').classList.remove('d-none');
            document.getElementById('close-category-list').classList.add('d-none');
        } else {
            selectItems.style.display = 'block';
            document.getElementById('open-category-list').classList.add('d-none');
            document.getElementById('close-category-list').classList.remove('d-none');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.custom-category-select')) {
            selectItems.style.display = 'none';
            document.getElementById('open-category-list').classList.remove('d-none');
            document.getElementById('close-category-list').classList.add('d-none');
        }
    });
}


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

function checkRequiredInput() {
    let isTitleValid = checkIfTitleEmpty();
    let isDateValid = checkIfDateEmpty();
    let isCategoryValid = checkIfCategoryEmpty();

    return isTitleValid && isDateValid && isCategoryValid;
}

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

function deactivateSubcategory() {
    document.getElementById('at-subcategory-clear')?.classList.add('d-none');
    document.getElementById('at-subcategory-border')?.classList.add('d-none');
    document.getElementById('at-subcategory-confirm')?.classList.add('d-none');
    document.getElementById('at-subcategory-open')?.classList.remove('d-none');
}

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

function clearInputSubcategory(event) {
    let inputField = document.getElementById('add-subcategory');
    event.stopPropagation();
    inputField.value = '';
}

function renderSubcategory() {
    let content = document.getElementById('added-subcategories');
    content.innerHTML = '';
    let subcategory = document.getElementById('add-subcategory');
    let newCategory = subcategory.value;
    if (newCategory !== '') {
        subcategoriesChoosed.push(newCategory);
        subtaskCompleted.push('false');
        for (let i = 0; i < subcategoriesChoosed.length; i++) {
            let choosedSubcategorie = subcategoriesChoosed[i];
            content.innerHTML += /*html*/`
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
        </div>
        `
        }
        subcategory.value = '';
        deactivateSubcategory();
    }
    else {
        for (let i = 0; i < subcategoriesChoosed.length; i++) {
            let choosedSubcategorie = subcategoriesChoosed[i];
            content.innerHTML += /*html*/`
        <div class="choosed-subcategorie-container">
            <input class="choosed-subcategory-input" value="${choosedSubcategorie}" id="choosed-subcategory-${i}">
            <div class="choosed-subcategorie-btn-container">
                <img onclick="focusInput('choosed-subcategory-${i}')" class="at-choosed-subcategory-edit" src="assets/img/editDark.png" id="at-choosed-subcategory-edit">
                <div class="small-border-container"></div>
                <img onclick="removeSubcategory(${i})" class="at-choosed-subcategory-delete" src="assets/img/delete.png" id="at-choosed-subcategory-delete">
            </div>
            <div class="choosed-subcategorie-btn-container-active-field">
                <img onclick="removeSubcategory(${i})" class="at-choosed-subcategory-delete" src="assets/img/delete.png" id="at-choosed-subcategory-delete-active">
                <div class="small-border-container-gray"></div>
                <img class="at-choosed-subcategory-check" src="assets/img/checkOkDarrk.png" id="at-choosed-subcategory-check-active">
            </div>
        </div>
        `
        }
    }
}

function removeAllSubcategory() {
    subcategoriesChoosed.splice(subcategoriesChoosed.length);
    renderSubcategory();
}

function focusInput(inputId) {
    document.getElementById(inputId).focus();
}

function removeSubcategory(i) {
    subcategoriesChoosed.splice(i, 1);
    subtaskCompleted.splice(i, 1);
    renderSubcategory();
}

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

function goToBoard() {
    let bgAddedNote = document.getElementById('bg-task-added-note');
    bgAddedNote.style.zIndex = 100;
    let addedNote = document.getElementById('task-added-note');
    addedNote.classList.add('confirmation-task-creation-shown');
    setTimeout(function () {
        window.location.href = './board.html';
    }, 2000);
}

function setupContactSearchPlaceholder() {
    const searchInput = document.getElementById('contact-search');
    const originalPlaceholder = document.getElementById('original-placeholder');

    if (!searchInput || !originalPlaceholder) {
        console.error('Elemente "contact-search" oder "original-placeholder" wurden nicht gefunden.');
        return;
    }

    // Event-Listener für "focus"
    searchInput.addEventListener('focus', function() {
        originalPlaceholder.style.display = 'none'; // Verstecke den Platzhalter beim Fokus
    });

    // Event-Listener für "blur"
    searchInput.addEventListener('blur', function() {
        if (this.value === '') {
            originalPlaceholder.style.display = 'block'; // Zeige den Platzhalter wieder, wenn das Eingabefeld leer ist
        }
    });
}
