# Ontop Time Tracking - Development Guide

This file provides comprehensive guidance for working with the Ontop Time Tracking MVP codebase. It reflects the current status and future direction of the project.

## 🎯 Project Mission

To build a standalone time tracking MVP that addresses a core friction point for Ontop's hourly-paid customers, providing a competitive alternative to platforms like Deel and Rippling.

**Goal:** A polished, functional proof-of-concept ready for frontend team review and eventual integration into the main Ontop platform. Full business requirements are documented in `docs/PRD.md`.

---

## 🏗️ Project Architecture & Status

### Tech Stack
- **Frontend:** Angular v19 with standalone components
- **Styling:** Custom CSS with Tailwind-inspired utility classes
- **Data Storage:** LocalStorage (MVP) → Supabase/Ontop Backend (production)
- **File Processing:** `xlsx` library for Excel parsing, File API for uploads

### Current Status: MVP Complete
The core MVP functionality is complete and stable. The application successfully covers the primary user journey of importing workers, tracking time with proof, and approving hours.

- ✅ **Client Setup:** CSV/XLSX import, worker activation flow, and per-worker tracking mode selection.
- ✅ **Worker Time Tracking:** Dual modes (`Clock In/Out` vs. `Timesheet`) with distinct UIs and logic.
- ✅ **Proof of Work:** Screenshot capture and file upload, required for timesheet submissions.
- ✅ **Approval Workflow:** Client dashboard with individual and bulk approval capabilities.
- ✅ **Reporting:** On-demand Excel export of time summaries.
- ✅ **Data Management:** Utilities for resetting hours or all application data.

---

## 🚀 Immediate Next Features (MVP Polish)

This section outlines the next set of features to be implemented to round out the MVP and address key usability gaps before handing off to the frontend team.

| Feature | Description | Priority |
| :--- | :--- | :--- |
| **1. Worker Dashboard & Feedback** | Create a dedicated view for workers to see the status of their submitted time entries (`approved`, `rejected`), including any notes from the client. Closes the feedback loop. | **High** |
| **2. Client Proof of Work Review** | Integrate a modal or panel in the approval workflow for clients to easily view the screenshots and files attached to a time entry before approving. | **High** |
| **3. Time Entry Editing** | Allow workers to edit the details (hours, description) of their `draft` or `submitted` time entries. Edits should be disabled once an entry is `approved` or `rejected`. | **Medium** |
| **4. Dedicated Reports Page** | Create a new "Reports" page with more advanced filtering (by worker, date range) and visual data representations (e.g., bar charts for hours per worker). | **Medium** |
| **5. Code Quality Refinements** | Centralize helper functions, create a reusable ButtonComponent, and refactor large components like `worker-tracking` to improve maintainability. | **Low** |

---

## 📅 Future Roadmap (Tier 2 & Integration)

These features are planned for a subsequent development phase and will be key for full integration into the Ontop platform.

- **Project & Task Tracking:** Allow time to be assigned to specific client-defined projects or tasks for better cost allocation and billing.
- **Improved Company Settings:** A dedicated settings area for clients to define company-wide rules, such as:
  - Standard work week definition (e.g., 40 hours) for overtime calculations.
  - Default currency for reporting.
  - Project templates for quick setup.
- **API Hooks for Notifications:** Implement event emitters or simple hooks that the main Ontop platform can listen to for triggering notifications (e.g., via Zapier or Ontop's notification center).

---

### Out of Scope for Standalone MVP

The following features will be handled by the main Ontop platform upon integration and are not planned for the standalone version:

- **Billable vs. Non-Billable Time:** Handled by Ontop's contract and invoicing system.
- **User Roles & Permissions:** Will leverage Ontop's existing user management.
- **Archiving/Contract Termination:** Worker status will be synced from the main platform.
- **Invoicing & Budgeting:** Core functionalities of the main Ontop platform.
- **Third-Party Integrations:** To be managed through the central Ontop ecosystem.

---

## 📊 Data Models & Interfaces

### Core Interfaces
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  trackingPreferences: { /* ... */ };
  workers: Worker[];
}

interface Worker {
  contractorId: string;
  name:string;
  email: string;
  inviteToken: string;
  isActive: boolean;
  trackingMode: 'clock' | 'timesheet';
  joinedAt?: string;
}

interface TimeEntry {
  id: string;
  workerId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  manualHours?: number;
  description: string;
  proofOfWork: ProofOfWork[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  clientNotes?: string;
}

interface ProofOfWork {
  id: string;
  type: 'screenshot' | 'note' | 'file';
  timestamp: string;
  content: string; // base64 data
  fileName?: string;
  fileSize?: number;
}
```

---

## 🛠️ Development Setup & Commands

### Project Initialization
```bash
# Navigate to project
cd ontop-time-tracking/src

# Install dependencies
npm install

# Start development server
npm start
```

### Key Dependencies
```json
{
  "dependencies": {
    "@angular/core": "...",
    "uuid": "...",
    "xlsx": "..."
  }
}
```

---

*This development guide is the single source of truth for the project's status and direction. Refer to `docs/PRD.md` for the original business requirements.*