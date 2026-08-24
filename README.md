# Join – AI Issue Collector

Join is a responsive Kanban board with an AI-assisted issue collector. Stakeholders can submit feature requests, bugs, and technical tasks by email. An n8n workflow reads the message, uses Google Gemini to classify and prioritize it, and creates a ticket in the board's **Triage** column.

## Getting Started

### Prerequisites

- A modern web browser
- A local web server, for example the VS Code Live Server extension
- A Firebase project with Authentication and Realtime Database enabled
- An n8n instance for the email automation
- Gmail and Google Gemini credentials connected in n8n

### 1. Clone the repository

```bash
git clone https://github.com/edda14/Joyn-Juls.git
cd Joyn-Juls
```

### 2. Configure Firebase

Create a Firebase web app and enter its public web configuration in `js/firebase.js`.

In Firebase Authentication, enable:

- Email/Password
- Anonymous authentication for the guest login

Create a Realtime Database and deploy the included rules:

```bash
firebase login
firebase use <your-firebase-project-id>
firebase deploy --only database
```

The Firebase web API key identifies the Firebase project and is not a server secret. Passwords, service-account files, private API keys, and n8n credentials must never be committed.

### 3. Configure n8n

Import the workflow JSON files from the `n8n/` directory and reconnect your own credentials. Credential values are not included in exported workflows.

Create an n8n Data Table named `issue_requests` with these columns:

| Column | Type | Purpose |
| --- | --- | --- |
| `requestDate` | String | Date of the request in `YYYY-MM-DD` format |
| `messageId` | String | Gmail message identifier |
| `status` | String | Processing state such as `processing`, `created`, or `error` |

Connect the required services:

- Gmail for receiving, replying to, and labeling messages
- Google Gemini for issue analysis
- Firebase Realtime Database for creating tickets

Update the public production webhook URLs in:

- `js/landing.js` for the daily request counter
- `js/dragDrop.js` for ticket status notifications

Publish all workflows after testing them.

### 4. Start the application

Serve the project through a local web server. With VS Code Live Server, open `index.html` and select **Open with Live Server**.

Do not open the HTML files directly with a `file://` URL because Firebase and browser modules require an HTTP origin.

## How to Use

The application starts at `index.html` with the Join logo animation and a role selection.

### Stakeholder flow

1. Select **Create request**.
2. Review the live daily request counter.
3. Select **Create request** again to open the visitor's email application.
4. Send a request that includes a useful description and, optionally, urgency or a deadline.
5. The workflow analyzes the email and creates an AI-labeled ticket in **Triage**.
6. The sender receives a confirmation email.
7. When the ticket changes column, the sender receives a status update.

Example email:

```text
Subject: Login error in Join

The login form shows an error after submitting.
This is urgent and should be fixed by 25 August 2026.
```

### Team member flow

1. Select **Member log in**.
2. Sign in with a registered Firebase account or use **Guest Log in**.
3. Explore the summary, create tasks, manage contacts, and move tickets across the board.

## Features

- Responsive Kanban board down to 320 px viewport width
- Triage as the default backlog for manual and email-generated tickets
- Email-based issue submission through Gmail and n8n
- AI-generated title, category, priority, description, and optional deadline
- Supported issue categories: bug, user story, and technical task
- Visible AI-generated ticket marker
- Internal and external creator information in task details
- Email confirmation after successful ticket creation
- Error reply and Gmail label for requests requiring manual review
- Status-change notification via n8n webhook
- Daily limit of 10 automatically processed requests
- Automatic limit reply without creating an additional AI ticket
- Email/Password and anonymous Firebase Authentication

## How It Works

```text
Stakeholder email
      |
      v
Gmail label: Join/Neu
      |
      v
n8n daily-limit check
      |
      +---- limit reached ----> limit reply + Join/Erledigt
      |
      v
Google Gemini analysis
      |
      +---- error -----------> error reply + Join/Zu bearbeiten
      |
      v
Firebase Realtime Database
      |
      v
Join Triage ticket + confirmation reply + Join/Erledigt
```

The browser application reads tasks and contacts from Firebase Realtime Database. Moving an externally created ticket calls the status-change webhook, which sends the creator an email through n8n.

## n8n Workflows

### 01 – Email to Triage

Receives messages from Gmail, extracts sender, subject, and body, checks the daily limit, analyzes the request with Gemini, creates the Firebase ticket, sends the appropriate reply, and updates Gmail labels.

### 02 – Status Change Notification

Receives status changes from Join through a production webhook and emails the external ticket creator.

### 03 – Daily Request Counter

Returns the current public counter used by the stakeholder landing page:

```json
{
  "used": 0,
  "limit": 10,
  "remaining": 10,
  "limitReached": false
}
```

## Ticket Data

Email-created tickets use the same structure as manually created Join tasks and additionally include source and creator metadata.

```json
{
  "title": "Login error in Join",
  "description": "The login form displays an error. This ticket was AI-generated.",
  "date": "2026-08-25",
  "prio": "urgent",
  "category": "Bug",
  "status": "triage",
  "creator": {
    "type": "external",
    "role": "stakeholder",
    "name": "Example User",
    "email": "example@example.com"
  },
  "source": "email",
  "aiGenerated": true
}
```

## Project Structure

```text
join283/
├── assets/             Images, icons, and local fonts
├── css/                Page and component styles
├── js/                 Firebase, board, contacts, and landing-page logic
├── n8n/                Exported workflow JSON files
├── template/           Shared HTML templates
├── database.rules.json Firebase Realtime Database rules
├── firebase.json       Firebase CLI configuration
├── index.html          Public role-selection landing page
├── stakeholder.html    Stakeholder email information page
├── login.html          Team member and guest login
└── board.html          Kanban board
```

## Security

- Firebase Authentication manages user passwords; passwords are never stored in the database.
- Private Gemini, Gmail, OAuth, and Firebase service-account credentials belong in their provider credential stores, not in source control.
- `.gitignore` excludes environment files, Firebase debug data, service-account files, and local n8n credential exports.
- Before every push, review staged files with `git diff --cached` and run a secret scan.
- The stakeholder counter and status webhooks are public endpoints and must not contain credentials in their URLs or payloads.

## Known Limitations

- Depending on the sender's email provider and spam-filter settings, automated confirmation emails may be delivered to the spam folder.

## Final Test Checklist

- Register, log in, log out, and use guest login
- Create a manual task and confirm that it appears in Triage
- Assign contacts and open, edit, and move a task
- Send a valid email and verify ticket creation, confirmation, and `Join/Erledigt`
- Force an AI-processing error and verify the error reply and `Join/Zu bearbeiten`
- Verify that request 11 receives the limit reply and creates no ticket
- Move an external ticket and verify the status email
- Test the landing page and board at 320 px, tablet, desktop, and wide-screen widths
- Confirm that no credentials or secret keys are included in the Git history or n8n exports

## Technology

- Semantic HTML5, CSS, and vanilla JavaScript
- Firebase Authentication and Realtime Database
- n8n
- Gmail
- Google Gemini

## Repository

[GitHub – Joyn-Juls](https://github.com/edda14/Joyn-Juls)
