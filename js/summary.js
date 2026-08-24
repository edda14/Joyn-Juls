let newUser = JSON.parse(sessionStorage.getItem('currentUser'));

/** Initializes data and layout for the summary page. */
async function summeryInit() {
    await includeHTML();
    await loadDataTask();
    await loadDataContacts();
    showInitials();
    updateGreeting();
    userName();
    updateSummary();
    checkResposive();
}

/** Opens the board, optionally at a specific section. */
function redirectToBoard(sectionId) {
  if (sectionId) {
     
      window.location.href = `./board.html#${sectionId}`;
  } else {
      
      window.location.href = "./board.html";
  }
}

/** Updates the time-dependent greeting. */
function updateGreeting() {
  let greetingText = document.getElementById('greetingText');
  let currentHour = new Date().getHours();

  if (currentHour < 12) {
    greetingText.textContent = 'Good Morning,';
  } else if (currentHour < 18) {
    greetingText.textContent = 'Good Afternoon,';
  } else {
    greetingText.textContent = 'Good Evening,';
  }
}

/** Renders the current user's name. */
function userName() {
  let userNameContainer = document.getElementById('userName');
  let currentUser = newUser.name;

  userNameContainer.innerHTML = /*html*/`
    ${currentUser}
  `
}

/** Calculates and renders all summary metrics. */
function updateSummary() {
  let tasksInBoard = tasks.length;
  let tasksInProgress = tasks.filter(task => task.status === 'progress').length;
  let awaitingFeedback = tasks.filter(task => task.status === 'feedback').length;
  let urgent = tasks.filter(task => task.prio === 'urgent').length;
  let urgentTasks = tasks.filter(task => task.prio === 'urgent');
  let sortedUrgentTasks = urgentTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  let upcomingDeadline = sortedUrgentTasks.length > 0 ? formatDate(sortedUrgentTasks[0].date) : 'No urgent tasks';
  let done = tasks.filter(task => task.status === 'done').length;
  let toDo = tasks.filter(task => task.status === 'triage').length;

  document.getElementById('tasksInBoard').textContent = tasksInBoard;
  document.getElementById('tasksInProgress').textContent = tasksInProgress;
  document.getElementById('awaitingFeedback').textContent = awaitingFeedback;
  document.getElementById('urgent').textContent = urgent;
  document.getElementById('upcomingDeadline').textContent = upcomingDeadline;
  document.getElementById('done').textContent = done;
  document.getElementById('toDo').textContent = toDo;
}

/** Formats an ISO date for the summary deadline card. */
function formatDate(dateString) {
  let date = new Date(dateString);
  let options = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/** Selects the responsive greeting presentation. */
function checkResposive() {
  let mediaQuery = window.matchMedia("(max-width: 980px)");
  let previousPath = document.referrer;
  let background = document.querySelector(".animatedImageContainer");
  let animatedImage = document.querySelector(".greetingContainer");

  if (mediaQuery.matches && previousPath.includes('index.html')) {
    greetingAnimation(background, animatedImage, mediaQuery);
  } else if (mediaQuery.matches) {  
    background.style.display ='none';
    animatedImage.style.display ='none';
  } else {
    background.style.display ='none';
    animatedImage.style.display ='flex';
  }
}

/** Runs or skips the responsive greeting animation. */
function greetingAnimation(background, animatedImage, mediaQuery) {

  if (mediaQuery) {
      startAnimation(background, animatedImage);
  } else {
    hideElements(background, animatedImage);
  }
}


/** Starts the greeting fade-out transition. */
function startAnimation(background, animatedImage) {
    background.classList.add("fadeOut");
    animatedImage.classList.add("fadeOut");

    setTimeout(function () {
      hideElements(background, animatedImage);
    }, 1500);
}

/** Hides responsive greeting elements. */
function hideElements(background, animatedImage) {
  background.style.display ='none';
  animatedImage.style.display ='none';
}
