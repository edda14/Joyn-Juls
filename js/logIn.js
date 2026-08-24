let isChecked = false;
let guest = { name: "Guest", email: null, role: "guest" };


/** Initializes login-page data and input behavior. */
async function logInInit() {
  await loadDataContacts();
  getSavedUser();
  addHoverForLogin();
  checkInputs();
}


/** Opens the sign-up page. */
function redirectToSignup() {
  window.location.href = "./signUp.html";
}



/** Starts the legacy Join-logo transition when requested. */
function joinImgAnimation() {
  let background = document.querySelector(".animatedImageContainer");
  let animatedImage = document.querySelector(".animatedImage");
  let responsiveImg = document.querySelector(".animatedImageResposive");
  let joinIcon = document.querySelector(".joinIcon");
  let mediaQuery = window.matchMedia("(max-width: 730px)");

  setTimeout(function() {
    startAnimation(background, animatedImage, joinIcon, responsiveImg, mediaQuery);
  }, 300);
}  


/** Applies the responsive logo animation classes. */
function startAnimation(background, animatedImage, joinIcon, responsiveImg, mediaQuery) {
  if (mediaQuery.matches) {
    background.classList.add("fadeOut");
    responsiveImg.classList.add("move");
    animatedImage.classList.add("move");
  } else {
    background.classList.add("fadeOut");
    animatedImage.classList.add("moveToTopLeft");
  }

    setTimeout(function () {
      hideElements(background, animatedImage, joinIcon, responsiveImg, mediaQuery);
    }, 500);
}

/** Hides the completed logo-animation elements. */
function hideElements(background, animatedImage, joinIcon, responsiveImg, mediaQuery) {
  if (mediaQuery.matches)  {
    responsiveImg.classList.add("hideElements");
    background.classList.add("hideElements");
  }
  background.classList.add("hideElements");
  animatedImage.classList.add("hideElements");
  joinIcon.classList.remove("hideElements");

}


/** Updates the enabled visual state of the login button. */
function checkInputs() {
  let logInButton = document.getElementById("logIn");
  let emailInput = document.getElementById("logInEmailInput");
  let passwordInput = document.getElementById("logInPasswordInput");

  if (emailInput.value.trim() !== "" && passwordInput.value.trim() !== "") {
    logInButton.classList.add("logInValid");
  } else {
    logInButton.classList.remove("logInValid");
  }
}


/** Connects login inputs to button-state validation. */
function addHoverForLogin() {
  let emailInput = document.getElementById("logInEmailInput");
  let passwordInput = document.getElementById("logInPasswordInput");
  emailInput.addEventListener("input", checkInputs);
  passwordInput.addEventListener("input", checkInputs);
}


/** Authenticates the submitted member login. */
async function findUser(event) {
  event.preventDefault();
  const emailInput = document.getElementById("logInEmailInput");
  const passwordInput = document.getElementById("logInPasswordInput");
  resetInputBorders(emailInput, passwordInput);
  try {
    const firebaseUser = await authenticateLogin(emailInput.value, passwordInput.value);
    await completeLogin(firebaseUser, emailInput.value);
  } catch (error) {
    handleInvalidUser(emailInput, passwordInput);
    console.error("Firebase login failed:", error.code);
  }
}

/** Authenticates the current login form values with Firebase. */
function authenticateLogin(email, password) {
  return window.firebaseAuth.loginWithEmail(email.trim().toLowerCase(), password, isChecked);
}

/** Stores the authenticated session and opens the board summary. */
async function completeLogin(firebaseUser, enteredEmail) {
  const user = { uid: firebaseUser.uid,
    name: firebaseUser.displayName || enteredEmail.split('@')[0],
    email: firebaseUser.email };
  sessionStorage.setItem('currentUser', JSON.stringify(user));
  await addNewContact(user);
  redirectToSummary();
}

/** Creates a matching contact for a newly authenticated member. */
async function addNewContact(user) {
  const email = normalizeEmail(user.email);
  const existingContact = contacts.find(contact => normalizeEmail(contact.mail) === email);
  if (existingContact) return;
  const color = getRandomProfileColor();
  const newContact = {
      name: user.name,
      mail: email,
      phone: '',
      profileColor: color,
      initials: extractInitials(user.name),
  };
  await changeContact(`/contacts/${user.uid}`, newContact);
}

/** Returns a consistently comparable email address. */
function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

/** Resets login input border feedback. */
function resetInputBorders(emailInput, passwordInput) {
  emailInput.style.borderColor = "";
  passwordInput.style.borderColor = "";
}


/** Opens the summary page. */
function redirectToSummary() {
  window.location.href = "./summary.html";
}

/** Creates and stores an anonymous Firebase guest session. */
async function guestLogin() {
  let form = document.querySelector('form');
  try {
    const firebaseUser = await window.firebaseAuth.loginAnonymously();
    sessionStorage.setItem('currentUser', JSON.stringify({
      ...guest,
      uid: firebaseUser.uid,
      isAnonymous: true,
    }));
    form.reset();
    redirectToSummary();
  } catch (error) {
    console.error('Firebase guest login failed:', error.code);
    alert('Guest login is currently unavailable. Please try again shortly.');
  }
}


/** Displays invalid-login feedback. */
function handleInvalidUser(emailInput, passwordInput) {
  let passwordAlert = document.querySelector(".passwordAlert");
  let rememberMe = document.querySelector(".rememberMe");

  let handleInvalidInput = () => {
    emailInput.style.borderColor = "#FF8190";
    passwordInput.style.borderColor = "#FF8190";
    passwordAlert.classList.remove("dNone");
    rememberMe.style.margin = "1px 42px 16px 42px";
  };

  handleInvalidInput();

  return false;
}


/** Toggles password visibility from the login field icon. */
function handlePaswordVisibility() {
  let passwordInput = document.getElementById("logInPasswordInput");

  if (passwordInput.classList.contains("passwordInputImg")) {
    passwordInput.classList.remove("passwordInputImg");
    passwordInput.classList.add("lockInputImg");
  } else if (passwordInput.classList.contains("lockInputImg")) {
    passwordInput.classList.remove("lockInputImg");
    passwordInput.classList.add("passwordInputFocus");
  } else if (passwordInput.classList.contains("passwordInputFocus")) {
    passwordInput.classList.remove("passwordInputFocus");
    passwordInput.classList.add("passwordInputVisible");
    passwordInput.type = "text";
  } else if (passwordInput.classList.contains("passwordInputVisible")) {
    passwordInput.classList.remove("passwordInputVisible");
    passwordInput.classList.add("passwordInputFocus");
    passwordInput.type = "password";
  }
}


/** Restores the password field's idle icon state. */
function handlepaswordImg(element) {
  if (element.classList.contains("passwordInputImg")) {
    element.classList.remove("passwordInputImg");
    element.classList.add("lockInputImg");
  } else if (element.classList.contains("lockInputImg")) {
    element.classList.remove("lockInputImg");
    element.classList.add("passwordInputImg");
  } else if (element.classList.contains("passwordInputFocus")) {
    element.classList.remove("passwordInputFocus");
    element.classList.add("passwordInputImg");
    element.type = "password";
  } else if (element.classList.contains("passwordInputVisible")) {
    element.classList.remove("passwordInputVisible");
    element.classList.add("passwordInputImg");
    element.type = "password";
  }
}


/** Applies the focused password field style. */
function handlepaswordStyle(element) {
  if (element.classList.contains("passwordInputImg")) {
    element.classList.remove("passwordInputImg");
    element.classList.add("passwordInputFocus");
  } else if (element.classList.contains("lockInputImg")) {
    element.classList.remove("lockInputImg");
    element.classList.add("passwordInputFocus");
  } else if (element.classList.contains("passwordInputVisible")) {
    element.classList.remove("passwordInputVisible");
    element.classList.add("passwordInputFocus");
  }
}


/** Toggles the remember-me checkbox state. */
function toggleCheckbox(img) {
  let checkmark = document.getElementById("checkmark");
  checkmark.classList.toggle("dNone");

  if (checkmark.classList.contains("dNone")) {
    img.src = "/assets/img/emptyCheckbox.png";
    isChecked = false;
  } else {
    img.src = "/assets/img/chackBox.png";
    isChecked = true;
  }
}


/** Relies on Firebase Auth to restore any saved session. */
function getSavedUser() {
  // Firebase Auth manages persistent sessions without storing passwords in web storage.
}
