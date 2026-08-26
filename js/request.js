const REQUEST_URL = "https://julsino.app.n8n.cloud/webhook/join-stakeholder-request";
const COUNTER_URL = "https://julsino.app.n8n.cloud/webhook/join-daily-request-count";
const REQUEST_LIMIT = 10;
const NAME_MIN = 5;
const NAME_MAX = 20;
const SUBJECT_MIN = 5;
const SUBJECT_MAX = 30;
const MESSAGE_LIMIT = 550;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} '\u2019-]*[\p{L}\p{M}]$/u;
const SUBJECT_PATTERN = /^[\p{L}\p{M}\p{N} .,!?:;()&+\/#'\u2019-]+$/u;
let selectedPriority = "medium";

/** Returns a form control by its id. */
function getField(id) {
  return document.getElementById(id);
}

/** Shows or clears the validation message for one field. */
function setFieldError(id, message) {
  const field = getField(`request${id}`);
  getField(`${id.toLowerCase()}Error`).textContent = message;
  field.classList.toggle("invalid", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
}

/** Checks the name length and requires a first and last name. */
function validateName() {
  const value = getField("requestName").value.trim();
  const hasFullName = value.split(/\s+/).filter(Boolean).length >= 2;
  const validLength = value.length >= NAME_MIN && value.length <= NAME_MAX;
  const validChars = NAME_PATTERN.test(value);
  const valid = hasFullName && validLength && validChars;
  const message = getNameError(value.length, hasFullName, validChars);
  setFieldError("Name", valid ? "" : message);
  return valid;
}

/** Returns the matching validation message for the name field. */
function getNameError(length, hasFullName, validChars) {
  if (length < NAME_MIN) return "Please enter at least 5 characters.";
  if (length > NAME_MAX) return "Please use no more than 20 characters.";
  if (!validChars) return "Please use letters, spaces, hyphens or apostrophes only.";
  return hasFullName ? "" : "Please enter your first and last name.";
}

/** Checks that the email value has a valid email format. */
function validateEmail() {
  const field = getField("requestEmail");
  const valid = field.value.trim() !== "" && field.validity.valid;
  setFieldError("Email", valid ? "" : "Please enter a valid email address.");
  return valid;
}

/** Checks that the subject has an allowed length. */
function validateSubject() {
  const value = getField("requestSubject").value.trim();
  const validLength = value.length >= SUBJECT_MIN && value.length <= SUBJECT_MAX;
  const valid = validLength && SUBJECT_PATTERN.test(value);
  const message = getSubjectError(value);
  setFieldError("Subject", valid ? "" : message);
  return valid;
}

/** Returns the matching validation message for the subject field. */
function getSubjectError(value) {
  if (value.length < SUBJECT_MIN) return "Please enter at least 5 characters.";
  if (value.length > SUBJECT_MAX) return "Please use no more than 30 characters.";
  return SUBJECT_PATTERN.test(value) ? "" : "Please remove unsupported special characters.";
}

/** Checks that the request message contains at least ten characters. */
function validateDescription() {
  const length = getField("requestDescription").value.trim().length;
  const valid = length >= 10 && length <= MESSAGE_LIMIT;
  const message = valid ? "" : length > MESSAGE_LIMIT ? "Please use no more than 200 characters." : "Please enter at least 10 characters.";
  setFieldError("Description", message);
  return valid;
}

/** Validates every required form field. */
function validateForm() {
  const results = [validateName(), validateEmail(), validateSubject(), validateDescription()];
  return results.every(Boolean);
}

/** Updates the visible minimum character counter. */
function updateMessageCount() {
  const count = getField("requestDescription").value.trim().length;
  getField("messageCount").textContent = `${count} / ${MESSAGE_LIMIT}`;
}

/** Returns the correct image path for a priority state. */
function getPriorityIcon(priority, selected) {
  const suffix = selected ? "-white" : "";
  return `./assets/img/${priority}${suffix}.png`;
}

/** Renders the selected priority and its icon colors. */
function renderPriority() {
  document.querySelectorAll(".priorityButton").forEach((button) => {
    const selected = button.dataset.priority === selectedPriority;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.querySelector("img").src = getPriorityIcon(button.dataset.priority, selected);
  });
}

/** Stores the priority selected by the stakeholder. */
function selectPriority(event) {
  selectedPriority = event.currentTarget.dataset.priority;
  renderPriority();
}

/** Collects and normalizes all request form values. */
function getRequestData() {
  return {
    name: getField("requestName").value.trim(),
    email: getField("requestEmail").value.trim(),
    subject: getField("requestSubject").value.trim(),
    description: getField("requestDescription").value.trim(),
    deadline: getField("requestDeadline").value,
    priority: selectedPriority,
  };
}

/** Sends the request without requiring an installed email application. */
async function sendRequest(data) {
  const response = await fetch(REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(data),
  });

  if (response.ok) return { success: true };

  const result = await response.json().catch(() => ({}));
  throw createRequestError(response, result);
}

/** Creates a readable error from the n8n response. */
function createRequestError(response, result) {
  const error = new Error(result.message || "The request could not be sent.");
  error.code = result.code || (response.status === 429 ? "DAILY_LIMIT_REACHED" : "REQUEST_FAILED");
  return error;
}

/** Displays a success, limit, or error message above the form. */
function showFormMessage(message, type = "success") {
  const box = getField("formMessage");
  box.textContent = message;
  box.className = `formMessage ${type === "success" ? "" : `${type}Message`}`.trim();
  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Enables or disables the form while a request is being sent. */
function setLoading(loading) {
  const button = getField("submitRequest");
  button.disabled = loading;
  button.textContent = loading ? "Sending..." : "Send request ✓";
}

/** Replaces the request form with its success confirmation. */
function showSuccessContent() {
  getField("requestTitle").textContent = "Request sent";
  document.querySelector(".requestIntro").hidden = true;
  getField("formMessage").hidden = true;
  getField("requestForm").hidden = true;
  getField("successContent").hidden = false;
  getField("successContent").focus();
}

/** Handles a validated request submission. */
async function submitRequest(event) {
  event.preventDefault();
  if (!validateForm()) return;
  setLoading(true);
  try {
    await sendRequest(getRequestData());
    showSuccessContent();
  } catch (error) {
    handleRequestError(error);
  } finally {
    setLoading(false);
  }
}

/** Shows the appropriate feedback for a failed submission. */
function handleRequestError(error) {
  if (error.code === "DAILY_LIMIT_REACHED") {
    showFormMessage("The daily limit of 10 requests has been reached. Please try again tomorrow.", "limit");
    return lockRequestForm();
  }
  showFormMessage("Your request could not be processed. Please try again later.", "error");
}

/** Loads today's counter data from n8n. */
async function loadRequestCount() {
  const response = await fetch(COUNTER_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("The counter is unavailable.");
  return response.json();
}

/** Updates the counter shown on the request page. */
function renderRequestCounter(data) {
  const used = Math.max(0, Math.min(REQUEST_LIMIT, Number(data.used) || 0));
  const counter = getField("requestCounter");
  counter.innerHTML = `<strong>${used} of ${REQUEST_LIMIT}</strong> requests used today`;
  counter.classList.toggle("requestCounterLimit", used >= REQUEST_LIMIT);
  counter.removeAttribute("aria-busy");
  if (used >= REQUEST_LIMIT || data.limitReached === true) lockRequestForm();
}

/** Disables the form when no automatic request slot remains. */
function lockRequestForm() {
  getField("requestForm").querySelectorAll("input, textarea, button").forEach((field) => {
    field.disabled = true;
  });
  showFormMessage("The daily limit of 10 requests has been reached. Please try again tomorrow.", "limit");
}

/** Sets the earliest selectable deadline to today. */
function setMinimumDeadline() {
  getField("requestDeadline").min = new Date().toISOString().split("T")[0];
}

/** Adds validation and interaction listeners to the request form. */
function addRequestListeners() {
  getField("requestForm").addEventListener("submit", submitRequest);
  getField("requestDescription").addEventListener("input", updateMessageCount);
  document.querySelectorAll(".priorityButton").forEach((button) => {
    button.addEventListener("click", selectPriority);
  });
}

/** Initializes the stakeholder request page. */
async function initRequestPage() {
  setMinimumDeadline();
  addRequestListeners();
  renderPriority();
  try {
    renderRequestCounter(await loadRequestCount());
  } catch (error) {
    console.warn("The daily request counter is currently unavailable.", error);
    getField("requestCounter").removeAttribute("aria-busy");
  }
}

document.addEventListener("DOMContentLoaded", initRequestPage);
