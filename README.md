# NexaCore — Employee Management System

NexaCore is a premium, clean minimalist SaaS portal designed for unified company operations, project resource tracking, and automated monthly payroll generation. Built with a developer-first design language mimicking the Shadcn UI template, the application balances sleek visuals with functional, role-based workflows for HR Administrators, Project Managers, and Employees.


## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Strict interface adaptation and endpoint route security depending on session roles (`HR`, `PROJECT_MANAGER`, `EMPLOYEE`).
*   **Minimalist Dashboard Grids:** High-fidelity analytics dashboards featuring transaction counts, monthly vertical updates charts, and custom SVG area curve graphs.
*   **Employee Onboarding:** Portal for HR administrators to provision default credentials and database records for new staff members.
*   **Session Auth Integration:** Integrated security using Better Auth with cookie session verification.


## 🛠️ Tech Stack

### Frontend (Next.js Client)
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS (v4)
*   **Typography:** Inter (Google Fonts)
*   **Icons:** Lucide React
*   **Authentication Client:** Better Auth React SDK

### Backend (Express.js API)
*   **Framework:** Express.js (TypeScript)
*   **Database Client:** Prisma (MongoDB)
*   **Authentication Server:** Better Auth
*   **Validation:** Zod Schema Payloads
*   **Pattern:** Model-View-Controller (MVC) Structure

---

## 📂 Project Structure

```bash
NexaCore/
├── frontend/               # Next.js Client Application
│   ├── app/                # App Router Pages & Routes
│   │   ├── (dashboard)/    # Dashboard layout & sub-pages
│   │   ├── login/          # Clean login page
│   │   └── page.tsx        # Homepage landing page
│   ├── components/         # Shared UI components (Sidebar, Header, Navbar)
│   ├── public/             # Branding assets (logo, icons)
│   └── package.json        # Frontend dependencies
│
└── backend/                # Express.js REST API
    ├── prisma/             # Prisma Client & MongoDB Schema
    ├── src/
    │   ├── config/         # Database clients & auth configurations
    │   ├── controllers/    # Request handlers & logic
    │   ├── middlewares/    # Session checks & role verification
    │   ├── routes/         # REST endpoints maps
    │   ├── validators/     # Zod payload structures
    │   └── app.ts          # Server entrypoint
    ├── .env.example        # Environment variables template
    └── package.json        # Backend dependencies
```

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Atlas Cluster or Local Instance)

### 1. Setup Backend API
Navigate to the backend folder, configure environment variables, and start the server:

```bash
# Navigate to backend
cd backend

# Copy environment template
copy .env.example .env

# Install dependencies
npm install

# Generate Prisma DB client
npx prisma generate

# Start the Express server
npm run dev
```
*Note: Make sure to configure the `DATABASE_URL` cluster connection string inside your `.env` file.*

### 2. Setup Frontend Client
Open a new terminal window, navigate to the frontend folder, and launch the dev client:

```bash
# Navigate to frontend
cd frontend

# Install pruned dependencies
npm install

# Start Next.js client
npm run dev
```
Open `http://localhost:3000` in your browser to view the NexaCore landing page. You can navigate to `/login` to access the SSO portal.

---

## 🔒 Session Verification & Routes

The Express backend secures endpoints using cookie-based session verification and middleware checks:
*   `roleGuard(["HR"])` secures onboarding and profile adjustments.
*   `roleGuard(["HR", "PROJECT_MANAGER"])` secures appraisals and leave requests.
*   Authentication states map dynamically to client views using the `useSession()` hook.

---

## 📄 License
This project is private and proprietary. All rights reserved.
