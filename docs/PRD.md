# Ontop Time Tracking MVP - Product Requirements Document

## Executive Summary

**Problem Statement:** Ontop customers paying workers hourly must manually update worked hours in the payroll system, creating friction in what should be an automated platform experience.

**Solution:** A standalone time tracking application that allows workers to clock in/out, upload proof of work, and enables clients to approve hours and export reports for seamless payroll integration.

**Business Impact:** Addresses a pain point in 1/10 deals, particularly critical for hourly-payment customers who currently compare Ontop unfavorably to Deel/Rippling.

---

## 🎯 MVP Scope & Success Metrics

### Core MVP Features (3-Day Timeline)
1. **Client Setup Flow** - Upload Ontop contracts CSV/XLSX, auto-import hourly workers
2. **Worker Time Tracking** - Clock in/out + manual hour entry options
3. **Proof of Work** - Screenshot capture capability
4. **Approval Workflow** - Client review and approve hours
5. **Report Export** - CSV download for payroll integration

### Success Metrics
- Functional proof-of-concept ready for frontend team review
- Seamless CSV/XLSX import of "Per Hour" contractors from Ontop reports
- End-to-end flow: client setup → worker tracking → approval → export

---

## 🧑‍💼 User Stories & Personas

### Primary Users

**👨‍💼 Client (Payroll Manager)**
- *"I need to verify my hourly contractors actually worked the hours they're claiming"*
- *"I want to export approved hours directly into our payroll system"*
- *"I need different tracking options for different types of workers"*

**👩‍💻 Worker (Hourly Contractor)**
- *"I need a simple way to track my hours without complicated software"*
- *"I want to prove I was working during my logged hours"*
- *"I need flexibility - sometimes I use other time tracking tools"*

### User Journey
```
Client Journey:
Setup Account → Upload Ontop CSV/XLSX → Configure Tracking Preferences → 
Invite Workers → Review Hours → Approve/Edit → Export Report

Worker Journey:
Receive Invite → Access Tracking Portal → Choose Method (Clock/Manual) → 
Track Hours → Upload Proof → Submit for Approval
```

---

## 🔧 Technical Architecture

### Tech Stack
- **Frontend:** Angular v19 with standalone components
- **Styling:** Custom CSS (Tailwind-inspired utility classes)
- **Data Storage:** LocalStorage (MVP) → Supabase/Database (Future)
- **File Handling:** File API for CSV/XLSX import, screenshot uploads, xlsx library for Excel parsing
- **Dependencies:** uuid, @types/uuid, xlsx
- **Deployment:** Vercel/Netlify

### Data Models

```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  trackingPreferences: {
    allowClockInOut: boolean;
    allowManualEntry: boolean;
    requireProofOfWork: boolean;
    screenshotFrequency: 'manual' | 'random' | 'disabled';
  };
  workers: Worker[];
}

interface Worker {
  contractorId: string;
  name: string;
  email: string;
  inviteToken: string;
  isActive: boolean;
}

interface TimeEntry {
  id: string;
  workerId: string;
  date: string;
  startTime?: string; // For clock in/out
  endTime?: string;
  manualHours?: number; // For manual entry
  description: string;
  proofOfWork: ProofOfWork[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  clientNotes?: string;
}

interface ProofOfWork {
  id: string;
  type: 'screenshot' | 'note';
  timestamp: string;
  content: string; // base64 image or text
  description?: string;
}
```

---

## 🎨 UI/UX Design Specifications

### Design Principles (Based on Ontop Platform)
- **Ontop Design Language:** Match existing platform's clean, professional aesthetic
- **Color Palette:** 
  - Primary: Blue (#4F46E5 - similar to Ontop's blue buttons)
  - Secondary: Red/coral (#EF4444 - similar to Ontop's red accents)
  - Background: Light gray (#F8FAFC)
  - Cards: White with subtle shadows
- **Typography:** Clean, modern sans-serif (similar to Ontop's font stack)
- **Component Style:** 
  - Rounded corners (8px radius)
  - Subtle shadows and borders
  - Consistent spacing and padding
  - Tab-based navigation (like Ontop's contract status tabs)
- **Mobile-First:** Responsive design matching Ontop's mobile approach
- **Data Tables:** Similar styling to Ontop's workforce table with filters

### Key UI Components

#### 1. Client Dashboard (Ontop Style)
```
┌─────────────────────────────────────┐
│ 🏢 ontop    Time Tracking           │
├─────────────────────────────────────┤
│ My workforce                        │
│ ┌─────┐ ┌────────┐ ┌─────────┐      │
│ │ All │ │ Active │ │ Pending │      │
│ │ 7   │ │   3    │ │    4    │      │
│ └─────┘ └────────┘ └─────────┘      │
│                                     │
│ [📤 Export report] [➕ Add worker]   │
│                                     │
│ │ Name          │Hours │Status │    │
│ │ Carlos Nieto  │ 8.5h │🟡     │    │
│ │ Giuliana F.   │ 7.0h │✅     │    │
│ │ Jose Meza     │ 6.5h │🟡     │    │
└─────────────────────────────────────┘
```

#### 2. Worker Time Tracking Interface
```
┌─────────────────────────────────────┐
│ Good morning, Carlos! 👋            │
├─────────────────────────────────────┤
│        ⏰ 00:00:00                  │
│                                     │
│     [🟢 CLOCK IN]                   │
│                                     │
│ OR                                  │
│                                     │
│ Manual Entry: [4.5] hours today     │
│ Task: [_________________]           │
│                                     │
│ 📸 Proof of Work:                   │
│ [Take Screenshot] [Upload File]     │
│                                     │
│ Today's Total: 0.0h                 │
└─────────────────────────────────────┘
```

#### 3. Screenshot Capture Flow
Based on industry standards (Apploye, DeskTime, Hubstaff):
- **Manual Screenshots:** Worker-triggered with description
- **Random Screenshots:** Optional, configurable intervals (5-30 min)
- **Privacy Options:** Blur sensitive areas, delete sensitive captures
- **Proof Context:** Link screenshots to specific time periods

---

## 📋 Feature Specifications

### Phase 1: Core MVP (Days 1-3)

#### Day 1: Foundation & Setup
- [x] **Project initialization** (Angular v19, custom CSS styling)
- [x] **File Import functionality** 
  - Parse Ontop contracts CSV and XLSX files
  - Filter for "Per Hour" workers (Column M)
  - Extract: Contractor ID (Column A), Name, Email
- [x] **Basic client dashboard** with worker list
- [x] **Worker invitation system** (shareable links)

#### Day 2: Time Tracking Core
- [x] **Dual tracking options:**
  - Clock in/out with live timer
  - Manual hour entry with date picker
- [x] **Time entry management:**
  - Daily summary view
  - Edit/delete capabilities
  - Status tracking (draft → submitted → approved)
- [x] **Basic proof of work:**
  - Screenshot capture via File API
  - Manual file upload
  - Simple text descriptions

#### Day 3: Approval & Export
- [x] **Client approval interface:**
  - Review all worker submissions
  - Approve/reject with notes
  - Bulk operations
- [x] **CSV Export functionality:**
  - Configurable date ranges
  - Format compatible with payroll systems
  - Include: Worker ID, Name, Total Hours, Status
- [x] **UI Polish & Testing**

### Phase 2: Enhancements (Future)
- Automatic screenshot intervals
- GPS location verification
- Real-time notifications
- **Integration with Ontop platform and mobile wallet app**
- Advanced analytics and reporting
- **Native mobile app integration** (leverage existing Ontop Wallet app)

---

## 🔒 Security & Privacy Considerations

### MVP Security Measures
- **Client-side data encryption** for sensitive information
- **Secure file handling** for screenshots
- **Privacy controls** - workers can delete sensitive screenshots
- **Access control** - invite-only access via unique tokens

### Privacy Best Practices (Industry Standard)
- **Transparent monitoring:** Clear disclosure of screenshot capabilities
- **Configurable privacy:** Blur/disable options for sensitive work
- **Data ownership:** Client controls all data, workers own their entries
- **Retention policies:** Clear data deletion timelines

---

## 📈 Future Integration Roadmap

### V2: Ontop Platform Integration
1. **API Integration:** Connect to Ontop's worker database
2. **SSO Implementation:** Use existing Ontop authentication
3. **Payroll Automation:** Direct integration with payment processing
4. **Real-time Sync:** Automatic hour updates in payroll system

### V3: Advanced Features
1. **AI-Powered Insights:** Productivity analytics and recommendations
2. **Compliance Tools:** Labor law compliance checking
3. **Team Management:** Manager hierarchy and permissions
4. **Invoice Generation:** Direct client billing from tracked hours

---

## 🚀 Deployment Strategy

### MVP Hosting (Recommendation)
- **Platform:** Vercel (free tier)
- **Domain:** `ontop-timetracking.vercel.app`
- **Data Storage:** Browser LocalStorage (temporary)
- **File Storage:** Base64 encoding in LocalStorage

### Production Considerations
- **Database:** Supabase or Firebase for scalability
- **CDN:** For screenshot/file storage
- **Security:** Auth0 or similar for production authentication
- **Monitoring:** Error tracking and analytics

---

## 📊 File Integration Specifications

### Ontop Contracts File Format
Supports both CSV and XLSX formats downloaded from Ontop platform:
```
Column A: Contractor ID (used for worker identification)
Column B: Contract Id  
Column D: Name
Column E: Email
Column M: Unit of payment (filter for "Per hour")
```

### Export CSV Format
```csv
contractor_id,name,email,period_start,period_end,total_hours,status,client_notes
2353,Carlos Nieto,carlos@email.com,2025-07-01,2025-07-31,156.5,approved,
2352,Giuliana Fontes,giuliana@email.com,2025-07-01,2025-07-31,142.0,approved,
```

---

## 🎯 3-Day Development Milestones

### Day 1 Deliverables
✅ Angular project setup with custom CSS styling
✅ CSV and XLSX upload and parsing functionality
✅ Basic client dashboard with worker list
✅ Worker invitation link generation

### Day 2 Deliverables  
✅ Worker time tracking interface (clock + manual)
✅ Screenshot capture functionality
✅ Time entry CRUD operations
✅ Daily summary views

### Day 3 Deliverables
✅ Client approval workflow
✅ CSV export functionality
✅ End-to-end testing
✅ Deployment to staging environment

---

## 🎨 Current Implementation Status

### ✅ Completed MVP Features
- **Complete File Organization**: Restructured codebase with proper docs/, config/ folders
- **Professional UI**: Material Icons throughout (removed all emoji icons)
- **Optimized Components**: Advanced data tables with filter labels and proper alignment
- **Responsive Design**: Components fit single screen without scrolling
- **Client Dashboard**: Full worker management and reporting capabilities
- **Worker Tracking**: Both clock-in/out and manual entry modes
- **Proof of Work**: Screenshot capture and file upload functionality
- **Approval Workflow**: Complete client review and approval system
- **Export System**: CSV export for payroll integration
- **Settings Management**: Client preferences and worker configuration

### 🏗️ Component Architecture Achievements
- **Comprehensive Design System**: Custom CSS variables and typography system
- **Advanced Data Tables**: Filterable, sortable, exportable tables with optimized spacing
- **Reusable Components**: Button, Layout, Navigation components with consistent styling
- **Material Design Integration**: Angular Material with custom Ontop theme
- **Responsive Layout**: Sidebar navigation optimized for embedding in Ontop platform

### 🎯 Platform Integration Ready
- **Clean Component Structure**: Removed platform-specific UI elements (user sections, help buttons)
- **Embeddable Design**: Components designed for seamless Ontop platform integration
- **Consistent Styling**: Professional Material Design throughout application
- **Optimized Performance**: Reduced component heights and improved layout efficiency

### 📈 Ready for Production
The application is a comprehensive time tracking solution with:
- Complete end-to-end functionality
- Professional UI/UX design
- Optimized for platform integration
- Scalable component architecture
- Production-ready code quality

---

## 🤝 Handoff to Frontend Team

### Documentation Package
1. **Technical specs:** Component architecture and data flow
2. **API requirements:** Future backend integration points  
3. **Design system:** Custom CSS component library
4. **User testing results:** Feedback from initial user testing

### Integration Requirements
- **Authentication:** How to integrate with Ontop's auth system
- **Database schema:** Migration from LocalStorage to production DB
- **API endpoints:** Required backend services for full integration
- **Security review:** Production-ready security considerations

---

## ✅ Acceptance Criteria

### MVP Success Definition
- ✅ Client can upload Ontop CSV or XLSX and see hourly workers
- ✅ Workers can track time via clock in/out OR manual entry
- ✅ Workers can upload proof of work (screenshots/files)
- ✅ Client can review, approve/reject hours with notes
- ✅ Client can export approved hours as CSV for payroll
- ✅ Application works on desktop and mobile browsers
- ✅ Data persists between sessions (LocalStorage)

**Ready for Frontend Team Review:** Application demonstrates core value proposition and technical feasibility for full platform integration.

---

*This PRD serves as the foundation for your 3-day vibe-coding sprint. Focus on core functionality first, then polish. The goal is proving the concept works before full platform integration!* 🚀 