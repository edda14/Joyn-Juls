let isChecked = false;

/** Returns the registration confirmation backdrop. */
function getSignUpPopupContainer() {
  let signUpPopupContainer = document.getElementById('signUpPopupContainer');
  return signUpPopupContainer;
}

/** Returns the registration confirmation card. */
function getSignUpPopup() {
  let signUpPopup = document.getElementById('signUpPopup');
  return signUpPopup;
}


/** Validates and submits a new Firebase member registration. */
async function addUser(event) {
  event.preventDefault();
  const { name, email, password, confirmPassword } = getSignUpInputs();
  resetInputBorders(name, email, password, confirmPassword);
  if (!isValidInput(name, email, password, confirmPassword)) {
    handleInvalidInput(name, email, password, confirmPassword);
    return false;
  }
  if (!isChecked) return rejectMissingPrivacyConsent();
  try {
    await registerUserInputs(name, email, password);
  } catch (error) {
    showRegistrationError(error, email, password, confirmPassword);
  }
  return false;
}

/** Returns all required sign-up input elements. */
function getSignUpInputs() {
  return { name: document.getElementById('signUpNameInput'),
    email: document.getElementById('signUpEmailInput'),
    password: document.getElementById('signUpPasswordInput'),
    confirmPassword: document.getElementById('confirmPasswordInput') };
}

/** Displays missing privacy-consent feedback and cancels submission. */
function rejectMissingPrivacyConsent() {
  document.querySelector('.acceptCheckbox').classList.add('redLine');
  document.querySelector('.signUp').style.marginTop = '0px';
  return false;
}

/** Registers the user, stores their profile, and shows confirmation. */
async function registerUserInputs(name, email, password) {
  const cleanName = name.value.trim();
  const cleanEmail = email.value.trim().toLowerCase();
  const user = await window.firebaseAuth.registerWithEmail(cleanName, cleanEmail, password.value);
  await saveUserProfile(user.uid, cleanName, cleanEmail);
  showSignUpPopup();
  setTimeout(hideSignUpPopupAndRedirect, 3000);
}

/** Clears previous sign-up validation feedback. */
function resetInputBorders(name, email, password, confirmPassword) {
  name.style.borderColor = "";
  email.style.borderColor = "";
  password.style.borderColor = "";
  confirmPassword.style.borderColor = "";
  document.querySelector(".passwordAlert").classList.add("dNone");
  document.querySelector(".acceptCheckbox").style.marginTop = "14px";
}

/** Checks all required sign-up values and password rules. */
function isValidInput(name, email, password, confirmPassword) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;
  return (
    name.value !== "" &&
    email.value !== "" &&
    passwordRegex.test(password.value) &&
    password.value === confirmPassword.value
  );
}


/** Marks invalid sign-up inputs. */
function handleInvalidInput(name, email, password, confirmPassword) {
  if (name.value === "") name.style.borderColor = "#FF8190";
  if (email.value === "") email.style.borderColor = "#FF8190";
  if (password.value === "") password.style.borderColor = "#FF8190";
  if (confirmPassword.value === "")
    confirmPassword.style.borderColor = "#FF8190";
  if (password.value !== confirmPassword.value) {
    password.style.borderColor = "#FF8190";
    confirmPassword.style.borderColor = "#FF8190";
    document.querySelector(".passwordAlert").classList.remove("dNone");
    document.querySelector(".acceptCheckbox").style.marginTop = "0px";
  }
}

/** Stores a member profile under its Firebase UID. */
async function saveUserProfile(uid, name, email) {
  await putUserData(`/users/${uid}`, { name, email });
}

/** Displays a readable Firebase registration error. */
function showRegistrationError(error, email, password, confirmPassword) {
  const alert = document.querySelector(".passwordAlert");
  const messages = {
    "auth/email-already-in-use": "This email address is already registered.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Please choose a stronger password.",
  };
  alert.textContent = messages[error.code] || "Sign up failed. Please try again.";
  alert.classList.remove("dNone");
  email.style.borderColor = "#FF8190";
  password.style.borderColor = "#FF8190";
  confirmPassword.style.borderColor = "#FF8190";
  console.error("Firebase sign-up failed:", error.code);
}

/** Shows the successful-registration popup. */
function showSignUpPopup() {
  let signUpPopupContainer = getSignUpPopupContainer();
  let signUpPopup = getSignUpPopup();

  signUpPopupContainer.classList.add('show');
  signUpPopup.classList.add('moveToCenter');
}


/** Hides the successful-registration popup. */
function hideSignUpPopup() {
  let signUpPopupContainer = getSignUpPopupContainer();
  let signUpPopup = getSignUpPopup();

  signUpPopupContainer.classList.remove('show');
  signUpPopup.classList.remove('moveToCenter');
} 


/** Hides confirmation and returns to login. */
function hideSignUpPopupAndRedirect() {
  hideSignUpPopup();
  redirectToLogIn();
}


/** Opens the login page. */
function redirectToLogIn() {
  window.location.href = "./login.html";
}


/** Toggles privacy-policy acceptance. */
function toggleCheckbox(img) {
  let checkmark = document.getElementById("checkmark");
  let signUpButton = document.querySelector(".signUp");
  if (checkmark.style.display === "none") { 
    checkmark.style.display = "block";
    img.src = "./assets/img/chackBox.png";
    signUpButton.classList.add("signUpHover");
    document.querySelector(".acceptCheckbox").classList.remove("redLine");
    document.querySelector(".signUp").style.marginTop = "1px";
    isChecked = true;
  } else {
    checkmark.style.display = "none";
    img.src = "./assets/img/emptyCheckbox.png";
    signUpButton.classList.remove("signUpHover");
    isChecked = false;
  }
}


/** Capitalizes the first character of a name field. */
function toUpperCase(inputName) {
    let name = inputName.value.trim();

    if (name.length > 0) {
      let firstChar = name.charAt(0).toUpperCase();
      let restOfName = name.slice(1);
      let fullName = firstChar + restOfName;
      inputName.value = fullName; 
    }
}


/** Toggles visibility for the primary password field. */
function handlePaswordVisibility() {
  let passwordInput = document.getElementById("signUpPasswordInput");

  if (passwordInput.classList.contains("passwordInputImg")) {
    passwordInput.classList.remove("passwordInputImg");
    passwordInput.classList.add("lockInputImg");
  } else if (passwordInput.classList.contains("lockInputImg")) {
    passwordInput.classList.remove("lockInputImg");
    passwordInput.classList.add("confirmPasswordInputFocus");
  } else if (passwordInput.classList.contains("confirmPasswordInputFocus")) {
    passwordInput.classList.remove("confirmPasswordInputFocus");
    passwordInput.classList.add("confirmPasswordInputVisible");
    passwordInput.type = "text";
  } else if (passwordInput.classList.contains("confirmPasswordInputVisible")) {
    passwordInput.classList.remove("confirmPasswordInputVisible");
    passwordInput.classList.add("confirmPasswordInputFocus");
    passwordInput.type = "password";
  }
}


/** Restores the primary password field's idle icon. */
function handlepaswordImg(element) {
  if (element.classList.contains("passwordInputImg")) {
    element.classList.remove("passwordInputImg");
    element.classList.add("lockInputImg");
  } else if (element.classList.contains("lockInputImg")) {
    element.classList.remove("lockInputImg");
    element.classList.add("passwordInputImg");
  } else if (element.classList.contains("confirmPasswordInputFocus")) {
    element.classList.remove("confirmPasswordInputFocus");
    element.classList.add("passwordInputImg");
    element.type = "password";
  } else if (element.classList.contains("confirmPasswordInputVisible")) {
    element.classList.remove("confirmPasswordInputVisible");
    element.classList.add("passwordInputImg");
    element.type = "password";
  }
}


/** Applies focus styling to the primary password field. */
function handlepaswordStyle(element) {
  if (element.classList.contains("passwordInputImg")) {
    element.classList.remove("passwordInputImg");
    element.classList.add("confirmPasswordInputFocus");
  } else if (element.classList.contains("lockInputImg")) {
    element.classList.remove("lockInputImg");
    element.classList.add("confirmPasswordInputFocus");
  } else if (element.classList.contains("confirmPasswordInputVisible")) {
    element.classList.remove("confirmPasswordInputVisible");
    element.classList.add("confirmPasswordInputFocus");
  }
}


/** Toggles visibility for the confirmation password field. */
function handleConfirmPaswordVisibility() {
  let confirmPasswordInput = document.getElementById("confirmPasswordInput");

  if (confirmPasswordInput.classList.contains("passwordInputImg")) {
    confirmPasswordInput.classList.remove("passwordInputImg");
    confirmPasswordInput.classList.add("lockInputImg");
  } else if (confirmPasswordInput.classList.contains("lockInputImg")) {
    confirmPasswordInput.classList.remove("lockInputImg");
    confirmPasswordInput.classList.add("confirmPasswordInputFocus");
  } else if (confirmPasswordInput.classList.contains("confirmPasswordInputFocus")) {
    confirmPasswordInput.classList.remove("confirmPasswordInputFocus");
    confirmPasswordInput.classList.add("confirmPasswordInputVisible");
    confirmPasswordInput.type = "text";
  } else if (confirmPasswordInput.classList.contains("confirmPasswordInputVisible")) {
    confirmPasswordInput.classList.remove("confirmPasswordInputVisible");
    confirmPasswordInput.classList.add("confirmPasswordInputFocus");
    confirmPasswordInput.type = "password";
  }
}


/** Restores the confirmation password field's idle icon. */
function handleConfirmPaswordImg(element) {
  if (element.classList.contains("passwordInputImg")) {
    element.classList.remove("passwordInputImg");
    element.classList.add("lockInputImg");
  } else if (element.classList.contains("lockInputImg")) {
    element.classList.remove("lockInputImg");
    element.classList.add("passwordInputImg");
  } else if (element.classList.contains("confirmPasswordInputFocus")) {
    element.classList.remove("confirmPasswordInputFocus");
    element.classList.add("passwordInputImg");
    element.type = "password";
  } else if (element.classList.contains("confirmPasswordInputVisible")) {
    element.classList.remove("confirmPasswordInputVisible");
    element.classList.add("passwordInputImg");
    element.type = "password";
  }
}


/** Applies focus styling to the confirmation password field. */
function handleConfirmPaswordStyle(element) {
  if (element.classList.contains("passwordInputImg")) {
    element.classList.remove("passwordInputImg");
    element.classList.add("confirmPasswordInputFocus");
  } else if (element.classList.contains("lockInputImg")) {
    element.classList.remove("lockInputImg");
    element.classList.add("confirmPasswordInputFocus");
  } else if (element.classList.contains("confirmPasswordInputVisible")) {
    element.classList.remove("confirmPasswordInputVisible");
    element.classList.add("confirmPasswordInputFocus");
  }
}
