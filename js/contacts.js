
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

function stripYouSuffix(name = '') {
    return name.replace(/\s*\(You\)\s*$/, '').trim();
}

function isCurrentUserContact(contact) {
    const signedInUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return Boolean(
        signedInUser?.email &&
        contact?.mail &&
        signedInUser.email.toLowerCase() === contact.mail.toLowerCase()
    );
}

function getContactDisplayName(contact) {
    const name = stripYouSuffix(contact?.name || '');
    return isCurrentUserContact(contact) ? `${name} (You)` : name;
}

let alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

async function contactInit() {
    await includeHTML();
    showInitials();
    await loadDataContacts();
    renderContacts();
    openContactFromUrl();
}

function renderContacts() {
    createContactList();
}

function createContactList(newContactIndex = null) {
    const contactList = document.getElementById('contact-list');
    contactList.innerHTML = '';
    const seenContacts = new Set(); // Set zum Nachverfolgen der bereits hinzugefügten Kontakte

    for (let j = 0; j < alphabet.length; j++) {
        const letter = alphabet[j];
        let letterAdded = false; // Flag, um zu überprüfen, ob der Buchstabe hinzugefügt wurde

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const initials = contact.initials;
            const firstLetter = initials.charAt(0).toUpperCase();

            const displayName = getContactDisplayName(contact);
            if (firstLetter === letter && !seenContacts.has(displayName)) {
                if (!letterAdded) {
                    const letterHeading = document.createElement('div');
                    letterHeading.textContent = firstLetter;
                    letterHeading.classList.add('letter-heading');
                    contactList.appendChild(letterHeading);
                    letterAdded = true;
                }

                const contactItem = document.createElement('div');
                contactItem.classList.add('contact');
                contactItem.dataset.contactId = contact.id;
                if (i === newContactIndex) {
                    contactItem.classList.add('active'); // Markiere den neuen Kontakt als aktiv
                }
                const profileColor = contact['profileColor'];
                const profilePicture = document.createElement('div');
                profilePicture.classList.add('profile-picture');
                profilePicture.style.backgroundColor = profileColor;
                profilePicture.textContent = initials;
                contactItem.appendChild(profilePicture);

                const contactDetails = document.createElement('div');
                contactDetails.classList.add('oneContact');
                contactDetails.innerHTML = `
                      <h2>${displayName}</h2>
                      <p class="blueColor">${contact.mail}</p>
                  `;
                contactItem.appendChild(contactDetails);
                contactList.appendChild(contactItem);

                // Füge dem Kontakt und den Kontaktinformationen einen Click-Event-Listener hinzu
                contactItem.onclick = function () {
                    // Entferne die 'active' Klasse von allen Kontakten
                    const allContacts = document.querySelectorAll('.contact');
                    allContacts.forEach(c => c.classList.remove('active'));

                    // Füge die 'active' Klasse zum geklickten Kontakt hinzu
                    contactItem.classList.add('active');

                    // Rufe die Kontaktinformationen mit dem aktuellen Kontakt ab
                    contactClickHandler(i);
                };

                seenContacts.add(displayName); // Kontakt als gesehen markieren
            }
        }
    }
}

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
function extractInitials(name) {
    const names = name.split(' ');
    let initial = '';
    for (let i = 0; i < names.length; i++) {
        initial += names[i].charAt(0).toUpperCase();
    }
    return initial;
}

async function getNewContact() {
    let name = document.getElementById('fullName');
    let email = document.getElementById('emailAdress');
    let phone = document.getElementById('phoneNumber');
    if (name.value == '' || email.value == '' || phone.value == '') {
        document.getElementById('addNewContactAlert').innerHTML = '';
        document.getElementById('addNewContactAlert').innerHTML = '<p>the fields must be filled</p>';
    } else {
        const color = getRandomProfileColor();
        const initialien = extractInitials(name.value);
        const newContact = {
            mail: email.value,
            name: name.value,
            initials: initialien,
            phone: phone.value,
            profileColor: color,
        };
        await postContact("/contacts", newContact);
        await loadDataContacts();
        const newContactIndex = contacts.length - 1;
        createContactList(newContactIndex);
        contactClickHandler(newContactIndex);
        name.value = '';
        email.value = '';
        phone.value = '';
        cancelAddContact();
        slideSuccessfullyContact();
    }
}

// Funktion, die beim Klicken auf den Kontakt oder Kontaktinformationen aufgerufen wird
function contactClickHandler(i) {
    let contact = contacts[i];
    if (window.innerWidth < 1300) {
        editContactResponsive(contact, i);
    } else {
        let contactSection = document.getElementById('viewContact');
        contactSection.innerHTML = getContactViewTemplate(contact, i);
    }
}

function editContactResponsive(contact, i) {
    document.getElementById('contactListContent').classList.add('d-none');
    document.getElementById('contactContent').classList.remove('d-noneResp');
    document.getElementById('addContactResp').classList.add('d-noneResp');
    
    let contactSection = document.getElementById('viewContact');
    contactSection.innerHTML = getResponsiveContactTemplate(contact, i);
}

function showEditDiv(i) {
    let editDivResp = document.getElementById('editDivResp');
    setTimeout(() => {
        editDivResp.style.right = '6px';
    }, 10);

}

function closeEditDiv() {
    let editDivResp = document.getElementById('editDivResp');
    setTimeout(() => {
        editDivResp.style.right = '-200px';
    }, 10);
}

function closeEditResponsive() {
     // Entferne die 'active' Klasse von allen Kontakten
     const allContacts = document.querySelectorAll('.contact');
     allContacts.forEach(c => c.classList.remove('active'));
    document.getElementById('contactListContent').classList.remove('d-none');
    document.getElementById('contactContent').classList.add('d-noneResp');
    // document.getElementById('editContactThirdSection').classList.remove('d-noneResp');
    document.getElementById('addContactResp').classList.remove('d-noneResp');
}

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

async function showEditContact(i) {
    let contact = contacts[i];
    let name = contact.name;
    isItYou = isCurrentUserContact(contact);
    let displayName = stripYouSuffix(name);

    const color = contact['profileColor'];

    document.getElementById('editContactSecondSection').innerHTML = '';
    document.getElementById('blurBackgroundEdit').classList.remove('d-none');
    editContact.style.display = "flex";
    setTimeout(() => {
        editContact.style.transform = "translateX(0)";
    }, 10);
    document.getElementById('editContactSecondSection').innerHTML = editContactHTML(i);
    document.getElementById('editName').value = displayName;
    document.getElementById('editEmail').value = contact.mail;
    document.getElementById('editPhone').value = contact.phone;
    document.getElementById('initialsEditContact').style.backgroundColor = color;
    document.getElementById('initialsText').innerHTML = contact.initials;
    // closeEditResponsive();
}

function editContactHTML(i) {
    let contact = contacts[i];
    return getEditContactTemplate(contact, i);
}

async function editContactToArray(i) {
    let contact = contacts[i];
    let name = document.getElementById('editName');
    let email = document.getElementById('editEmail');
    let phone = document.getElementById('editPhone');
    const initial = extractInitials(name.value);

    let myName = stripYouSuffix(name.value);

    const newContact = {
        "name": myName,
        "mail": email.value,
        "phone": phone.value,
        "profileColor": contact.profileColor,
        "initials": initial
    };

    await postContact("/contacts", newContact);
    await loadDataContacts();
    contactClickHandler(contacts.length - 1);
    cancelEditContact();
    createContactList();
}

// Öffnet die Box 'Add new Contact'
function showAddContact() {
    document.getElementById('addNewContactAlert').innerHTML = '';
    document.getElementById('blurBackground').classList.remove('d-none');
    addNewContact.style.display = "flex";
    setTimeout(() => {
        addNewContact.style.transform = "translateX(0)";
    }, 10);
}

function cancelAddContact() {
    addNewContact.style.transform = "translateX(120vw)";
    setTimeout(() => {
        addNewContact.style.display = "none";
        document.getElementById('blurBackground').classList.add('d-none');
    }, 500);
    closeEditDiv();
}

function cancelEditContact() {
    editContact.style.transform = "translateX(120vw)";
    setTimeout(() => {
        editContact.style.display = "none";
        document.getElementById('blurBackgroundEdit').classList.add('d-none');
    }, 500);
    closeEditDiv();
}
