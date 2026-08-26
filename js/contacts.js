
let beautifulColors = [
    '#B9A7EA', // pastel lilac
    '#F3A6C8', // pastel pink
    '#9BCBF4', // baby blue
    '#F4DB72', // butter lemon
    '#A8C8A0', // sage green
    '#F4B69D', // soft peach
    '#91D4CC', // pastel turquoise
    '#C7A6E8', // soft violet
    '#F3A7A7', // pastel coral
    '#AAB8EB', // periwinkle
    '#A8DDB5', // pastel mint
    '#E7B58A', // warm apricot
];

/**
 * Returns a random pastel color, preferring colors not yet used by a contact.
 * This keeps the contact list varied before colors begin to repeat.
 * @returns {string} CSS color value
 */
function getRandomProfileColor() {
    const usedColors = new Set(contacts.map(contact => contact.profileColor));
    const unusedColors = beautifulColors.filter(color => !usedColors.has(color));
    const colorPool = unusedColors.length > 0 ? unusedColors : beautifulColors;
    return colorPool[Math.floor(Math.random() * colorPool.length)];
}

/** Removes the current-user suffix from a contact name. */
function stripYouSuffix(name = '') {
    return name.replace(/\s*\(You\)\s*$/, '').trim();
}

/** Checks whether a contact represents the signed-in user. */
function isCurrentUserContact(contact) {
    const signedInUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return Boolean(
        signedInUser?.email &&
        contact?.mail &&
        signedInUser.email.toLowerCase() === contact.mail.toLowerCase()
    );
}

/** Returns the contact name used in the interface. */
function getContactDisplayName(contact) {
    const name = stripYouSuffix(contact?.name || '');
    return isCurrentUserContact(contact) ? `${name} (You)` : name;
}

let alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

/** Initializes the contacts page. */
async function contactInit() {
    await includeHTML();
    showInitials();
    await loadDataContacts();
    renderContacts();
    openContactFromUrl();
}

/** Renders the complete contact list. */
function renderContacts() {
    createContactList();
}

/** Builds the alphabetically grouped contact list. */
function createContactList(newContactIndex = null) {
    const contactList = document.getElementById('contact-list');
    contactList.innerHTML = '';
    const seenContacts = new Set();
    alphabet.forEach(letter => renderContactGroup(contactList, letter, seenContacts, newContactIndex));
}

/** Renders all unique contacts belonging to one alphabet group. */
function renderContactGroup(contactList, letter, seenContacts, newContactIndex) {
    let headingAdded = false;
    contacts.forEach((contact, index) => {
        const displayName = getContactDisplayName(contact);
        const contactKey = getContactKey(contact, displayName);
        if (!contactMatchesGroup(contact, letter, contactKey, seenContacts)) return;
        if (!headingAdded) headingAdded = appendContactHeading(contactList, letter);
        appendContactItem(contactList, contact, index, displayName, index === newContactIndex);
        seenContacts.add(contactKey);
    });
}

/** Checks whether a contact belongs in the requested alphabet group. */
function contactMatchesGroup(contact, letter, contactKey, seenContacts) {
    return contact.initials.charAt(0).toUpperCase() === letter && !seenContacts.has(contactKey);
}

/** Returns the stable identity used to hide legacy contact duplicates. */
function getContactKey(contact, displayName) {
    return contact?.mail?.trim().toLowerCase() || displayName.trim().toLowerCase();
}

/** Appends an alphabet heading and reports that it was added. */
function appendContactHeading(contactList, letter) {
    const heading = document.createElement('div');
    heading.textContent = letter;
    heading.classList.add('letter-heading');
    contactList.appendChild(heading);
    return true;
}

/** Builds and appends one selectable contact row. */
function appendContactItem(contactList, contact, index, displayName, isNewContact) {
    const item = document.createElement('div');
    item.classList.add('contact');
    item.dataset.contactId = contact.id;
    if (isNewContact) item.classList.add('active');
    item.appendChild(createContactAvatar(contact));
    item.appendChild(createContactDetails(contact, displayName));
    item.onclick = () => selectContactItem(item, index);
    contactList.appendChild(item);
}

/** Creates the avatar element for a contact row. */
function createContactAvatar(contact) {
    const avatar = document.createElement('div');
    avatar.classList.add('profile-picture');
    avatar.style.backgroundColor = contact.profileColor;
    avatar.textContent = contact.initials;
    return avatar;
}

/** Creates the name and email element for a contact row. */
function createContactDetails(contact, displayName) {
    const details = document.createElement('div');
    details.classList.add('oneContact');
    details.innerHTML = `<h2>${displayName}</h2><p class="blueColor">${contact.mail}</p>`;
    return details;
}

/** Activates a contact row and opens its details. */
function selectContactItem(item, index) {
    document.querySelectorAll('.contact').forEach(contact => contact.classList.remove('active'));
    item.classList.add('active');
    contactClickHandler(index);
}

/** Opens the contact specified in the page URL, if present. */
function openContactFromUrl() {
    const email = new URLSearchParams(window.location.search).get('email');
    if (!email) return;

    const contactIndex = contacts.findIndex(contact =>
        contact.mail && contact.mail.toLowerCase() === email.toLowerCase()
    );
    if (contactIndex < 0) return;

    document.querySelectorAll('.contact').forEach(contact => contact.classList.remove('active'));
    const selectedContact = document.querySelector(`[data-contact-id="${contacts[contactIndex].id}"]`);
    selectedContact?.classList.add('active');
    selectedContact?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    contactClickHandler(contactIndex);
}

// Hilfsfunktion zum Extrahieren des ersten Buchstabens des Vornamens und Nachnamens
/** Extracts uppercase initials from a full name. */
function extractInitials(name) {
    const names = name.split(' ');
    let initial = '';
    for (let i = 0; i < names.length; i++) {
        initial += names[i].charAt(0).toUpperCase();
    }
    return initial;
}

/** Validates and saves the add-contact form. */
async function getNewContact() {
    const inputs = getNewContactInputs();
    if (!contactInputsAreFilled(inputs)) return showContactInputAlert();
    await saveNewContact(inputs);
    clearContactInputs(inputs);
    cancelAddContact();
    slideSuccessfullyContact();
}

/** Returns the add-contact input elements. */
function getNewContactInputs() {
    return {
        name: document.getElementById('fullName'),
        email: document.getElementById('emailAdress'),
        phone: document.getElementById('phoneNumber'),
    };
}

/** Checks that all required contact fields contain text. */
function contactInputsAreFilled(inputs) {
    return Boolean(inputs.name.value && inputs.email.value && inputs.phone.value);
}

/** Displays the missing-contact-data message. */
function showContactInputAlert() {
    document.getElementById('addNewContactAlert').innerHTML = '<p>the fields must be filled</p>';
}

/** Saves a new contact and refreshes the selected contact view. */
async function saveNewContact(inputs) {
    const contact = buildNewContact(inputs);
    await postContact('/contacts', contact);
    await loadDataContacts();
    const index = contacts.length - 1;
    createContactList(index);
    contactClickHandler(index);
}

/** Builds the storage object for a new contact. */
function buildNewContact(inputs) {
    return {
        mail: inputs.email.value,
        name: inputs.name.value,
        initials: extractInitials(inputs.name.value),
        phone: inputs.phone.value,
        profileColor: getRandomProfileColor(),
    };
}

/** Clears all add-contact fields. */
function clearContactInputs(inputs) {
    Object.values(inputs).forEach(input => { input.value = ''; });
}

// Funktion, die beim Klicken auf den Kontakt oder Kontaktinformationen aufgerufen wird
/** Opens a selected contact in the appropriate layout. */
function contactClickHandler(i) {
    let contact = contacts[i];
    if (window.innerWidth <= 1150) {
        editContactResponsive(contact, i);
    } else {
        let contactSection = document.getElementById('viewContact');
        contactSection.innerHTML = getContactViewTemplate(contact, i);
    }
}

/** Opens contact details in the responsive layout. */
function editContactResponsive(contact, i) {
    document.getElementById('contactListContent').classList.add('d-none');
    document.getElementById('contactContent').classList.remove('d-noneResp');
    document.getElementById('addContactResp').classList.add('d-noneResp');
    
    let contactSection = document.getElementById('viewContact');
    contactSection.innerHTML = getResponsiveContactTemplate(contact, i);
}

/** Slides the responsive edit actions into view. */
function showEditDiv(i) {
    let editDivResp = document.getElementById('editDivResp');
    setTimeout(() => {
        editDivResp.style.right = '6px';
    }, 10);

}

/** Slides the responsive edit actions out of view. */
function closeEditDiv() {
    const editDivResp = document.getElementById('editDivResp');
    if (!editDivResp) return;
    setTimeout(() => {
        editDivResp.style.right = '-200px';
    }, 10);
}

/** Returns from responsive contact details to the contact list. */
function closeEditResponsive() {
     // Entferne die 'active' Klasse von allen Kontakten
     const allContacts = document.querySelectorAll('.contact');
     allContacts.forEach(c => c.classList.remove('active'));
    document.getElementById('contactListContent').classList.remove('d-none');
    document.getElementById('contactContent').classList.add('d-noneResp');
    // document.getElementById('editContactThirdSection').classList.remove('d-noneResp');
    document.getElementById('addContactResp').classList.remove('d-noneResp');
}

/** Displays the contact-created confirmation briefly. */
function slideSuccessfullyContact() {
    let container = document.getElementById('successfullyContainer');
    let successfully = document.getElementById('successfully');
    container.style.display = 'flex';
    successfully.classList.add('slide-in-bottom');
    setTimeout(() => {
        successfully.classList.remove('slide-in-bottom');
        container.style.display = 'none';
    }, 1000);
}

/** Opens a contact in the edit panel. */
async function showEditContact(i) {
    let contact = contacts[i];
    isItYou = isCurrentUserContact(contact);
    openEditContactPanel();
    populateEditContactPanel(contact, i);
}

/** Makes the edit-contact panel visible. */
function openEditContactPanel() {
    document.getElementById('editContactSecondSection').innerHTML = '';
    document.getElementById('blurBackgroundEdit').classList.remove('d-none');
    editContact.style.display = "flex";
    setTimeout(() => { editContact.style.transform = "translateX(0)"; }, 10);
}

/** Populates the edit-contact panel with stored values. */
function populateEditContactPanel(contact, index) {
    const displayName = stripYouSuffix(contact.name);
    document.getElementById('editContactSecondSection').innerHTML = editContactHTML(index);
    document.getElementById('editName').value = displayName;
    document.getElementById('editEmail').value = contact.mail;
    document.getElementById('editPhone').value = contact.phone;
    document.getElementById('initialsEditContact').style.backgroundColor = contact.profileColor;
    document.getElementById('initialsText').innerHTML = contact.initials;
}

/** Returns the edit form markup for one contact. */
function editContactHTML(i) {
    let contact = contacts[i];
    return getEditContactTemplate(contact, i);
}

/** Saves values edited in the contact form. */
async function editContactToArray(i) {
    const newContact = buildEditedContact(contacts[i]);
    await postContact('/contacts', newContact);
    await loadDataContacts();
    contactClickHandler(contacts.length - 1);
    cancelEditContact();
    createContactList();
}

/** Builds a contact object from the edit form. */
function buildEditedContact(contact) {
    const name = stripYouSuffix(document.getElementById('editName').value);
    return {
        name,
        mail: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        profileColor: contact.profileColor,
        initials: extractInitials(name),
    };
}

// Öffnet die Box 'Add new Contact'
/** Opens the add-contact panel. */
function showAddContact() {
    document.getElementById('addNewContactAlert').innerHTML = '';
    document.getElementById('blurBackground').classList.remove('d-none');
    addNewContact.style.display = "flex";
    setTimeout(() => {
        addNewContact.style.transform = "translateX(0)";
    }, 10);
}

/** Closes the add-contact panel. */
function cancelAddContact() {
    addNewContact.style.transform = "translateX(120vw)";
    setTimeout(() => {
        addNewContact.style.display = "none";
        document.getElementById('blurBackground').classList.add('d-none');
    }, 500);
    closeEditDiv();
}

/** Closes the edit-contact panel. */
function cancelEditContact() {
    editContact.style.transform = "translateX(120vw)";
    setTimeout(() => {
        editContact.style.display = "none";
        document.getElementById('blurBackgroundEdit').classList.add('d-none');
    }, 500);
    closeEditDiv();
}
