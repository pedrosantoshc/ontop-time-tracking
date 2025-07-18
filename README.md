# Ontop Time Tracking MVP

A time tracking application for Ontop to compete with Deel/Rippling. This MVP allows clients to track hourly workers' time, capture proof of work, and export reports for payroll.

## Features

- **CSV Import**: Upload Ontop contracts CSV to automatically import hourly workers
- **Dual Time Tracking**: Clock in/out + manual hour entry options
- **Proof of Work**: Screenshot capture capability
- **Approval Workflow**: Client review and approve hours
- **CSV Export**: Download for payroll integration

## Tech Stack

- **Frontend**: Angular v19
- **Styling**: CSS with Ontop design system
- **Data Storage**: LocalStorage (MVP) → Supabase (production)
- **Deployment**: Vercel

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── client-dashboard/
│   │   ├── worker-tracking/
│   │   ├── time-entry/
│   │   └── shared/
│   ├── services/
│   │   ├── csv-import.service.ts
│   │   ├── time-tracking.service.ts
│   │   └── storage.service.ts
│   └── models/
│       └── interfaces.ts
```

## 3-Day Development Sprint

- **Day 1**: CSV import + client dashboard
- **Day 2**: Worker tracking + screenshots
- **Day 3**: Approval workflow + export

## License

Private - Ontop Internal Use Only
