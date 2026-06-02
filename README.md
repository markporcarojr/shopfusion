# ShopFusion

A full-stack shop management tool built by a CNC machinist who codes.

ShopFusion bridges the gap between the machine shop floor and modern software development. It connects directly to **Autodesk Fusion 360** via a custom Python add-in, automatically capturing models and drawings and syncing them to a web dashboard — alongside job tracking, component management, and time logging.

---

## The Story

I'm a CNC machinist with 20 years of experience and a self-taught full-stack developer. ShopFusion is the intersection of both worlds — a tool I actually use at work, built with the same stack I use to build software.

Most shop management tools are expensive, overcomplicated, or designed for large operations. ShopFusion is lean, local, and built for a one-person or small shop environment.

---

## Features

### Fusion 360 Integration
- Custom Python add-in that runs inside Fusion 360
- Works in both **Design** and **Drawing** workspaces
- Captures model geometry (bounding box, bodies, components, material)
- Exports drawings as PDF and sends them to the dashboard
- Auto-creates jobs and components when fired — no manual entry needed

### Job Management
- Create and track jobs with job number, customer, description, status
- Searchable and sortable job list
- Hours worked tracking per job
- Status workflow: Active → Paused → Done

### Component Tracking
- Each job can have multiple components
- Material selection from a curated list of common shop materials
- Operations notes per component
- Full CRUD — add, edit, delete

### Drawings & Models
- All Fusion logs stored and searchable
- PDF drawings rendered inline with fullscreen view
- Linked back to jobs and components
- Sort by date, name, type, or job

### Time Entries
- Log estimated hours against any job
- Add notes per entry
- Edit and delete entries

### Dashboard
- Active job count
- Recent jobs, time entries, and Fusion logs
- Everything clickable — drill down from the dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Clerk |
| ORM | Prisma 7 |
| Database | SQLite (local) / PostgreSQL (production) |
| CAD Integration | Autodesk Fusion 360 Python API |

---

## Architecture

---

## Local Setup

### Prerequisites
- Node.js 20+
- Autodesk Fusion 360

### Web App

```bash
git clone https://github.com/markporcarojr/shopfusion.git
cd shopfusion
npm install
```

Create `.env`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
DIRECT_URL=file:./prisma/shopfusion.db
```

```bash
npx prisma db push
npx prisma generate
npm run dev
```

### Fusion 360 Add-in

1. Copy `fusion-addin/ShopFusion/` to your Fusion add-ins directory:
   - **Windows:** `%APPDATA%\Autodesk\Autodesk Fusion 360\API\AddIns\`
   - **Mac:** `~/Library/Application Support/Autodesk/Autodesk Fusion 360/API/AddIns/`

2. Update `API_ENDPOINT` in `ShopFusion.py`:
```python
   API_ENDPOINT = "http://localhost:3000/api/fusion/log"
```

3. In Fusion 360: **Shift+S** → Add-Ins tab → ShopFusion → Run

4. Click **"Log to ShopFusion"** from any Design or Drawing workspace

---

## Database

ShopFusion uses SQLite locally — a single file at `prisma/shopfusion.db`. No cloud, no cost, no inactivity pausing. The Prisma schema is portable to PostgreSQL for a multi-user or production deployment — just swap the provider and connection string.

---

## Schema
User
└── Job
├── Component
│   └── FusionLog (model or drawing)
└── TimeEntry

---

## Deploying to Production

1. Swap SQLite for Neon (PostgreSQL):
   - Update `prisma/schema.prisma` provider to `postgresql`
   - Add Neon connection strings to `.env`
   - Run `npx prisma migrate deploy`

2. Deploy to Vercel:
```bash
   vercel deploy
```

3. Update `API_ENDPOINT` in `ShopFusion.py` to your Vercel URL

---

## Author

**Mark Porcaro** — CNC Machinist + Full Stack Developer

- GitHub: [@markporcarojr](https://github.com/markporcarojr)
- Built with: 20 years of shop experience and a love for building things that work
