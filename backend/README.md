# NexaCore Express.js Backend API

This directory contains the Express.js REST API server for the **NexaCore Employee Management System**. It follows a strict **Model-View-Controller (MVC)** architectural pattern to separate routing, validation, middleware, and business logic.

---

## 1. Directory Structure

All application source code resides in the `src/` folder:

*   **`src/config/`**: Setup for external drivers, environment variables, database connections (Prisma), and Better Auth adapters.
*   **`src/models/`**: Additional database helper wrappers and data schemas if needed.
*   **`src/controllers/`**: Core controllers housing HTTP request handlers, parsing body elements, processing business logic, and returning JSON responses.
*   **`src/routes/`**: Slim route maps mapping HTTP endpoints to controllers. Business logic is forbidden here.
*   **`src/middlewares/`**: Shared Express middlewares like CORS, role guards, token verifiers, and global error handlers.
*   **`src/validators/`**: Zod verification schemas parsing request bodies, params, or queries before hitting controllers.
*   **`src/services/`**: Third-party connectors, notification dispatchers, or PDF compilers.

---

## 2. Core Architecture Rules

To maintain codebase integrity, any additions or modifications must strictly obey these guidelines:

### A. Thin Routes, Fat Controllers
*   Route files (`src/routes/`) should *only* declare endpoint paths, attach appropriate role guards/middlewares, and map them directly to controllers.
*   No database transactions or request validation checks may occur in routes.

### B. Mandatory Zod Validation Layer
*   Any endpoint carrying payload parameters (`POST`, `PUT`, `PATCH`) must run a validation middleware linked to a Zod schema from `src/validators/`. 
*   If payload parsing fails, the validator middleware must return a unified `400 Bad Request` block immediately, preventing invalid requests from triggering controllers.

### C. Prisma Client Data Layer
*   Use Prisma Client (`src/config/db.ts`) for all database operations. 
*   Do not write raw MongoDB queries or instantiate client connections manually. Utilize Prisma transactions (`$transaction`) for multi-document operations (e.g., creating both a `User` and `Account` entry).

### D. Session & Role Protection Middlewares
*   Access controls must be handled by reusable middlewares under `src/middlewares/`.
*   Private routes must utilize the session verification and role protection guard (`roleGuard.ts`) to intercept unauthorized calls before reaching database layers.
