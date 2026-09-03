# NexaCore — Employee Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-MongoDB-teal?logo=prisma)](https://www.prisma.io/)

A full-stack, decoupled enterprise operations and workforce platform built with **Next.js**, **Express TypeScript**, **Prisma ORM**, and **Better-Auth**.

---

## ⚡ Features

- **Role-Based Access Control (RBAC):** Tailored interfaces and API permissions for `HR`, `PROJECT_MANAGER`, and `EMPLOYEE`.
- **Geofenced Campus Attendance:** Real-time Haversine GPS check-in & clock-out validation against campus coordinates.
- **Sprint Kanban & Team Chat:** Multi-stage drag-and-drop task boards with Markdown details and channel messaging.
- **BDT Payroll & Payslips:** Automated monthly gross-to-net salary calculations, deductions, bonuses, and PDF payslips.
- **Leave & WFH Management:** Dual-ledger request workflows with reviewer approval queues.
- **Centralized Knowledge Base:** Resource hub for company policies, coding standards, and onboarding roadmaps.
- **Cryptographic Certificates:** Verifiable digital diplomas issued upon project settlement.
- **Enterprise Utilities:** Meeting room bookings, employee loan ledger, star evaluations, retreat polls, and grievance reporting.

---

## 🔑 Demo Accounts

Universal Password for all demo accounts: `Password123`

| Role | Name | Email |
| :--- | :--- | :--- |
| **HR Administrator** | Abir Hasan | `abir@nexacore.com` |
| **Project Manager** | Arefin Ahmed | `arefin@nexacore.com` |
| **Lead Developer** | Abdullah Al Mamun | `mamun@nexacore.com` |

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npx prisma generate

# Reset and seed database with Bangladeshi context demo data
npx tsx reset-and-seed-db.ts

# Start development API server (Port 5000)
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start Next.js development client (Port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```bash
NexaCore/
├── backend/                # Express TypeScript REST API
│   ├── prisma/             # Prisma schema & MongoDB models
│   ├── src/
│   │   ├── controllers/    # API endpoint controllers
│   │   ├── middlewares/    # RBAC & authentication guards
│   │   ├── routes/         # Express route handlers
│   │   └── services/       # Database seed and background services
│   └── reset-and-seed-db.ts# Database reset & seed script
│
└── frontend/               # Next.js App Router Client
    ├── app/                # App router pages & layouts
    │   ├── (dashboard)/    # Role-based dashboard modules
    │   ├── login/          # Minimal light-mode login portal
    │   └── page.tsx        # Homepage with 1-click database seeder
    └── components/         # Reusable UI components & modals
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
