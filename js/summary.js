let newUser = JSON.parse(sessionStorage.getItem('currentUser'));

/** Initializes summary and binds resize listener. */
async function summeryInit() {
    await includeHTML();
    await loadDataTask();
    await loadDataContacts();
    showInitials();
    updateGreeting();
    userName();
    updateSummary();
    checkResposive();
    window.addEventListener('resize', checkResposive);
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
  let metrics = calculateSummaryMetrics();
  renderSummaryValues(metrics);
}

/** Computes metrics from task list. */
function calculateSummaryMetrics() {
  let urgentTasks = tasks.filter(task => task.prio === 'urgent');
  let sortedUrgent = urgentTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  return {
    inBoard: tasks.length,
    inProgress: tasks.filter(t => t.status === 'progress').length,
    feedback: tasks.filter(t => t.status === 'feedback').length,
    urgent: urgentTasks.length,
    deadline: sortedUrgent.length > 0 ? formatDate(sortedUrgent[0].date) : 'No urgent tasks',
    done: tasks.filter(t => t.status === 'done').length,
    toDo: tasks.filter(t => t.status === 'triage').length,
    emailRequests: tasks.filter(t => isEmailTask(t)).length
  };
}

/** Checks if a task originated from an external email. */
function isEmailTask(t) {
  return t.source === 'email' || 
         t.creator?.type === 'email' || 
         t.creator?.type === 'external';
}

/** Updates HTML elements with calculated metrics. */
function renderSummaryValues(m) {
  document.getElementById('tasksInBoard').textContent = m.inBoard;
  document.getElementById('tasksInProgress').textContent = m.inProgress;
  document.getElementById('awaitingFeedback').textContent = m.feedback;
  document.getElementById('urgent').textContent = m.urgent;
  document.getElementById('upcomingDeadline').textContent = m.deadline;
  document.getElementById('done').textContent = m.done;
  document.getElementById('toDo').textContent = m.toDo;
  document.getElementById('emailRequests').textContent = m.emailRequests;
}

/** Formats an ISO date for the summary deadline card. */
function formatDate(dateString) {
  let date = new Date(dateString);
  let options = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/** Handles responsive greeting check. */
function checkResposive() {
  let mediaQuery = window.matchMedia("(max-width: 980px)");
  let overlay = document.querySelector(".animatedImageContainer");
  if (!overlay) return;

  if (mediaQuery.matches) {
    handleMobileGreeting(overlay);
  } else {
    resetDesktopView(overlay);
  }
}

/** Triggers mobile animation only if login flag is set. */
function handleMobileGreeting(overlay) {
  let shouldShow = sessionStorage.getItem('showGreeting');

  if (shouldShow === 'true') {
    sessionStorage.removeItem('showGreeting');
    playGreetingAnimation(overlay);
  } else if (!overlay.classList.contains('fadeOut')) {
    overlay.style.display = 'none';
  }
}

/** Plays the fade-out animation. */
function playGreetingAnimation(overlay) {
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add("fadeOut"), 1000);
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.classList.remove("fadeOut");
  }, 1500);
}

/** Runs or skips the responsive greeting animation. */
function greetingAnimation(background, animatedImage, mediaQuery) {
  if (mediaQuery.matches) {
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

/** Hides responsive greeting elements completely. */
function hideElements(background, animatedImage) {
  if (background) background.style.display = 'none';
  if (animatedImage) animatedImage.style.display = 'none';
}

/** Resets view when resizing back to desktop. */
function resetDesktopView(overlay) {
  overlay.style.display = 'flex';
  overlay.classList.remove("fadeOut");
}
