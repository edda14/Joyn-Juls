let isChecked = false;
let guest = { name: "Guest", email: null, role: "guest" };


async function logInInit() {
  joinImgAnimation();
  await loadDataContacts();
  getSavedUser();
  addHoverForLogin();
  checkInputs();
}


function redirectToSignup() {
  window.location.href = "./signUp.html";
}



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

function hideElements(background, animatedImage, joinIcon, responsiveImg, mediaQuery) {
  if (mediaQuery.matches)  {
    responsiveImg.classList.add("hideElements");
    background.classList.add("hideElements");
  }
  background.classList.add("hideElements");
  animatedImage.classList.add("hideElements");
  joinIcon.classList.remove("hideElements");

}


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


function addHoverForLogin() {
  let emailInput = document.getElementById("logInEmailInput");
  let passwordInput = document.getElementById("logInPasswordInput");
  emailInput.addEventListener("input", checkInputs);
  passwordInput.addEventListener("input", checkInputs);
}


async function findUser(event) {
  event.preventDefault();

  let emailInput = document.getElementById("logInEmailInput");
  let passwordInput = document.getElementById("logInPasswordInput");
  let email = emailInput.value;
  let password = passwordInput.value;
  let rememberMe = isChecked;
  resetInputBorders(emailInput, passwordInput);

  try {
    const firebaseUser = await window.firebaseAuth.loginWithEmail(
      email.trim().toLowerCase(),
      password,
      rememberMe
    );
    const user = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || email.split("@")[0],
      email: firebaseUser.email,
    };
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    await addNewContact(user.name, user.email);
    redirectToSummary();
  } catch (error) {
    handleInvalidUser(emailInput, passwordInput);
    console.error("Firebase login failed:", error.code);
  }
}

async function addNewContact(name, email) {
  const existingContact = contacts.find(
    contact => contact.mail && contact.mail.toLowerCase() === email.toLowerCase()
  );
  if (existingContact) return;

  const color = getRandomProfileColor();
  const initial = extractInitials(name); // Annahme: extractInitials ist bereits implementiert
  const newContact = {
      name: name,
      mail: email,
      phone: '', // Da wir keine Telefonnummer während der Registrierung erhalten
      profileColor: color,
      initials: initial,
  };

  await postContact("/contacts", newContact);
}

function resetInputBorders(emailInput, passwordInput) {
  emailInput.style.borderColor = "";
  passwordInput.style.borderColor = "";
}


function redirectToSummary() {
  window.location.href = "./summary.html";
}

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


function getSavedUser() {
  // Firebase Auth manages persistent sessions without storing passwords in web storage.
}
