import { PrismaClient, ExpenseCategory, ExpenseStatus, CertificateType, PollTarget, PollStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=======================================================");
  console.log("  NEXACORE ENTERPRISE DATABASE RESET & REINITIALIZATION");
  console.log("=======================================================\n");

  const defaultPassword = "Password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // ---------------------------------------------------------
  // 1. PURGE ALL COLLECTIONS
  // ---------------------------------------------------------
  console.log("[1/6] Purging all database collections...");
  await prisma.financeExpense.deleteMany({});
  await prisma.financeBudget.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.pollVote.deleteMany({});
  await prisma.pollOption.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.roomBooking.deleteMany({});
  await prisma.meetingRoom.deleteMany({});
  await prisma.calendarEvent.deleteMany({});
  await prisma.grievance.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.channel.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✔ All collections cleanly purged.");

  // ---------------------------------------------------------
  // 2. PROVISION HR ADMINISTRATOR
  // ---------------------------------------------------------
  console.log("\n[2/6] Provisioning HR Administrator...");
  const hrUser = await prisma.user.create({
    data: {
      name: "Jane Doe (HR Admin)",
      email: "hr@worksync.com",
      emailVerified: true,
      role: "HR",
      department: "Human Resources",
      designation: "Chief People Officer",
      phone: "+880 1711-000001",
      bio: "Head of Talent, People Operations, and Corporate Governance."
    }
  });

  await prisma.account.create({
    data: {
      userId: hrUser.id,
      providerId: "credential",
      accountId: "hr@worksync.com",
      password: hashedPassword
    }
  });
  console.log(`✔ HR Admin provisioned: ${hrUser.email}`);

  // ---------------------------------------------------------
  // 3. PROVISION PROJECT MANAGERS
  // ---------------------------------------------------------
  console.log("\n[3/6] Provisioning 5 Project Managers...");
  const managersData = [
    { name: "Asif Iqbal", email: "asif.iqbal@nexacore.com", designation: "Engineering Lead & PM", dept: "Engineering" },
    { name: "Fahmida Chowdhury", email: "fahmida.chowdhury@nexacore.com", designation: "Principal PM", dept: "Product" },
    { name: "Kazi Arafat", email: "kazi.arafat@nexacore.com", designation: "Agile Scrum Master", dept: "Operations" },
    { name: "Nabila Rahman", email: "nabila.rahman@nexacore.com", designation: "Tech Program Lead", dept: "Engineering" },
    { name: "Zeeshan Alam", email: "zeeshan.alam@nexacore.com", designation: "Platform Operations Manager", dept: "Infrastructure" }
  ];

  const createdManagers = [];
  for (const mgr of managersData) {
    const user = await prisma.user.create({
      data: {
        name: mgr.name,
        email: mgr.email,
        emailVerified: true,
        role: "PROJECT_MANAGER",
        department: mgr.dept,
        designation: mgr.designation,
        phone: "+880 1811-00000" + (createdManagers.length + 1)
      }
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: mgr.email,
        password: hashedPassword
      }
    });
    createdManagers.push(user);
    console.log(`✔ PM: ${user.name} (${user.email})`);
  }

  // ---------------------------------------------------------
  // 4. PROVISION SOFTWARE ENGINEERS
  // ---------------------------------------------------------
  console.log("\n[4/6] Provisioning 20 Software Engineers & Developers...");
  const employeesData = [
    { name: "Abir Hasan", email: "abir.hasan@nexacore.com", designation: "Senior Full-Stack Architect", dept: "Engineering", salary: 6500 },
    { name: "Tahsin Rahman", email: "tahsin.rahman@nexacore.com", designation: "Frontend Engineer (Next.js)", dept: "Engineering", salary: 4800 },
    { name: "Sadia Islam", email: "sadia.islam@nexacore.com", designation: "Backend Engineer (Node/Prisma)", dept: "Engineering", salary: 5200 },
    { name: "Nafis Ahmed", email: "nafis.ahmed@nexacore.com", designation: "Cloud DevOps Specialist", dept: "Infrastructure", salary: 5600 },
    { name: "Tanzila Akter", email: "tanzila.akter@nexacore.com", designation: "UI/UX Product Designer", dept: "Design", salary: 4600 },
    { name: "Zubair Rahman", email: "zubair.rahman@nexacore.com", designation: "Full-Stack Developer", dept: "Engineering", salary: 4500 },
    { name: "Farhana Yasmin", email: "farhana.yasmin@nexacore.com", designation: "QA Automation Engineer", dept: "Quality Assurance", salary: 4200 },
    { name: "Imtiaz Hossain", email: "imtiaz.hossain@nexacore.com", designation: "Systems Engineer", dept: "Infrastructure", salary: 4900 },
    { name: "Anika Tabassum", email: "anika.tabassum@nexacore.com", designation: "Product Strategist", dept: "Product", salary: 4700 },
    { name: "Mahmudul Hasan", email: "mahmudul.hasan@nexacore.com", designation: "Security Engineer", dept: "Engineering", salary: 5500 },
    { name: "Sajid Chowdhury", email: "sajid.chowdhury@nexacore.com", designation: "Data Platform Engineer", dept: "Engineering", salary: 5100 },
    { name: "Nusrat Jahan", email: "nusrat.jahan@nexacore.com", designation: "Frontend Specialist", dept: "Design", salary: 4400 },
    { name: "Rafsan Jany", email: "rafsan.jany@nexacore.com", designation: "Backend Developer", dept: "Engineering", salary: 4600 },
    { name: "Sabrina Sultana", email: "sabrina.sultana@nexacore.com", designation: "Mobile App Developer", dept: "Engineering", salary: 4700 },
    { name: "Tanvir Anjum", email: "tanvir.anjum@nexacore.com", designation: "Database Administrator", dept: "Infrastructure", salary: 5000 },
    { name: "Mehedi Hasan", email: "mehedi.hasan@nexacore.com", designation: "Software Engineer", dept: "Engineering", salary: 4300 },
    { name: "Jannatul Ferdous", email: "jannatul.ferdous@nexacore.com", designation: "Business Analyst", dept: "Product", salary: 4500 },
    { name: "Abrar Fahim", email: "abrar.fahim@nexacore.com", designation: "Junior Full-Stack Dev", dept: "Engineering", salary: 3800 },
    { name: "Taskin Ahmed", email: "taskin.ahmed@nexacore.com", designation: "Site Reliability Engineer", dept: "Infrastructure", salary: 5300 },
    { name: "Sumaiya Rahman", email: "sumaiya.rahman@nexacore.com", designation: "Growth & Marketing Lead", dept: "Marketing", salary: 4500 }
  ];

  const createdEmployees = [];
  for (const emp of employeesData) {
    const user = await prisma.user.create({
      data: {
        name: emp.name,
        email: emp.email,
        emailVerified: true,
        role: "EMPLOYEE",
        department: emp.dept,
        designation: emp.designation,
        phone: "+880 1911-0000" + (createdEmployees.length + 1)
      }
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: emp.email,
        password: hashedPassword
      }
    });

    // Create payroll baseline
    await prisma.payroll.create({
      data: {
        userId: user.id,
        month: "2026-08",
        baseSalary: emp.salary,
        bonus: 500.0,
        deductions: 100.0,
        netSalary: emp.salary + 400.0,
        status: "PAID",
        paidAt: new Date()
      }
    });

    createdEmployees.push(user);
    console.log(`✔ Dev: ${user.name} (${user.email}) - Base: $${emp.salary}`);
  }

  // ---------------------------------------------------------
  // 5. INITIALIZE WORKSPACES, KANBAN SPRINT & CHAT CHANNELS
  // ---------------------------------------------------------
  console.log("\n[5/6] Creating Enterprise Workspaces, Kanban Tasks & Chat Channels...");
  const devIds = createdEmployees.slice(0, 6).map(e => e.id);

  // Project 1
  const project1 = await prisma.project.create({
    data: {
      name: "NexaCore Cloud Platform v3.0",
      description: "High-performance enterprise workforce operations, geofenced tracking, and decoupled Next.js architecture.",
      category: "Engineering",
      budget: 65000.0,
      status: "ACTIVE",
      managerId: createdManagers[0].id, // Asif Iqbal
      employeeIds: devIds,
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    }
  });

  // Link project to users
  await prisma.user.updateMany({
    where: { id: { in: devIds } },
    data: { projectIds: { push: project1.id } }
  });
  await prisma.user.update({
    where: { id: createdManagers[0].id },
    data: { projectIds: { push: project1.id } }
  });

  // Chat Channels
  const chGeneral = await prisma.channel.create({
    data: { name: "general", projectId: project1.id }
  });
  const chTech = await prisma.channel.create({
    data: { name: "technical", projectId: project1.id }
  });
  const chAnnounce = await prisma.channel.create({
    data: { name: "announcements", projectId: project1.id }
  });

  await prisma.message.createMany({
    data: [
      {
        channelId: chGeneral.id,
        senderId: createdManagers[0].id,
        content: "Welcome team to the NexaCore v3.0 Sprint Workspace! Let's build something exceptional."
      },
      {
        channelId: chTech.id,
        senderId: createdEmployees[0].id, // Abir Hasan
        content: "Completed Better-Auth RBAC integration with MongoDB Prisma models. Next up: geofenced check-in radar."
      }
    ]
  });

  // Kanban Tasks with Markdown
  await prisma.task.createMany({
    data: [
      {
        title: "Implement Better-Auth Multi-Role Middleware",
        description: "### Specifications\n- Secure endpoints with `roleGuard(['HR', 'PROJECT_MANAGER', 'EMPLOYEE'])`.\n- Attach user session token in cookie.\n- Return `403 Forbidden` for unauthorized routes.",
        column: "COMPLETED",
        projectId: project1.id,
        assigneeId: createdEmployees[0].id, // Abir Hasan
        dueDate: new Date()
      },
      {
        title: "Build Geofenced GPS Check-In Radar",
        description: "### Implementation Notes\n- Calculate distance using **Haversine Formula** (Lat: 23.7749, Lng: 90.4255).\n- Enforce 200m radius threshold.",
        column: "COMPLETED",
        projectId: project1.id,
        assigneeId: createdEmployees[1].id,
        dueDate: new Date()
      },
      {
        title: "Integrate Chart.js Visual BI Analytics",
        description: "### Features\n- 6-Month Stacked Payroll Bar Chart\n- 7-Day Attendance Heatmap\n- Department Allocation Doughnut",
        column: "IN_PROGRESS",
        projectId: project1.id,
        assigneeId: createdEmployees[0].id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Conduct End-to-End Stress & Concurrency Testing",
        description: "Verify room booking concurrency limits and high-throughput websocket chat channels.",
        column: "TODO",
        projectId: project1.id,
        assigneeId: createdEmployees[2].id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }
    ]
  });
  console.log(`✔ Workspace "${project1.name}" created with 4 Kanban tasks & 3 chat channels.`);

  // ---------------------------------------------------------
  // 6. CORPORATE SUITES, FINANCE, OPEX & POLLS
  // ---------------------------------------------------------
  console.log("\n[6/6] Initializing Meeting Rooms, Corporate OpEx Budget & Pulse Polls...");

  // Meeting Rooms
  const room1 = await prisma.meetingRoom.create({
    data: {
      name: "Executive Boardroom Alpha",
      floor: "8th Floor (Executive Tower)",
      capacity: 18,
      amenities: ["4K Ultra-Wide Display", "Cisco Webex Room Bar", "Soundproof Acoustic Walls"],
      status: "AVAILABLE"
    }
  });
  const room2 = await prisma.meetingRoom.create({
    data: {
      name: "Turing Innovation Lab",
      floor: "6th Floor (Innovation Wing)",
      capacity: 10,
      amenities: ["Digital Whiteboard", "Dual Display System", "High-Speed Fiber"],
      status: "AVAILABLE"
    }
  });
  const room3 = await prisma.meetingRoom.create({
    data: {
      name: "Hopper Sprint Pod",
      floor: "4th Floor (Agile Deck)",
      capacity: 6,
      amenities: ["Standing Desk Setup", "Conference Speaker"],
      status: "AVAILABLE"
    }
  });

  // Corporate Budget & OpEx
  await prisma.financeBudget.create({
    data: {
      fiscalYear: 2026,
      quarter: "Q3",
      allocated: 250000.0,
      reserveFund: 50000.0
    }
  });

  await prisma.financeExpense.createMany({
    data: [
      {
        title: "AWS Multi-Region Production Cluster & S3 Storage",
        amount: 4850.0,
        category: "CLOUD_INFRASTRUCTURE" as ExpenseCategory,
        vendor: "Amazon Web Services Inc.",
        invoiceRef: "INV-AWS-2026-081",
        status: "APPROVED" as ExpenseStatus,
        date: "2026-08-01",
        notes: "Primary cloud infra, Kubernetes clusters, and backups.",
        recordedById: hrUser.id
      },
      {
        title: "GitHub Enterprise Cloud & Copilot Business Licenses",
        amount: 2200.0,
        category: "SAAS_SUBSCRIPTIONS" as ExpenseCategory,
        vendor: "GitHub / Microsoft",
        invoiceRef: "INV-GH-882194",
        status: "APPROVED" as ExpenseStatus,
        date: "2026-08-05",
        notes: "Annual developer tooling licenses for engineering division.",
        recordedById: hrUser.id
      },
      {
        title: "Apple MacBook Pro M3 Max & Dell UltraSharp 4K Monitors",
        amount: 14200.0,
        category: "HARDWARE_EQUIPMENT" as ExpenseCategory,
        vendor: "Apple Business Direct",
        invoiceRef: "INV-APL-77120",
        status: "APPROVED" as ExpenseStatus,
        date: "2026-08-10",
        notes: "Hardware upgrades for newly onboarded senior engineers.",
        recordedById: hrUser.id
      }
    ]
  });

  // Company Pulse Poll
  const poll = await prisma.poll.create({
    data: {
      title: "Annual Engineering Offsite 2026 Destination",
      description: "Cast your vote for the upcoming company-wide Q4 tech retreat!",
      target: "COMPANY_WIDE" as PollTarget,
      status: "ACTIVE" as PollStatus,
      authorId: hrUser.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      options: {
        create: [
          { text: "Cox's Bazar Beachfront Resort" },
          { text: "Sylhet Tea Garden Eco-Lodge" },
          { text: "Sajek Valley Cloud Peak" }
        ]
      }
    },
    include: { options: true }
  });

  // Cast initial votes
  await prisma.pollVote.create({
    data: {
      pollId: poll.id,
      optionId: poll.options[0].id,
      userId: createdEmployees[0].id
    }
  });
  await prisma.pollVote.create({
    data: {
      pollId: poll.id,
      optionId: poll.options[1].id,
      userId: createdEmployees[1].id
    }
  });

  // Digital Certificate for Abir Hasan
  await prisma.certificate.create({
    data: {
      certificateCode: "NEXA-CERT-2026-8812",
      title: "Full-Stack Core Architecture Excellence",
      type: "EXCELLENCE_AWARD" as CertificateType,
      description: "In recognition of outstanding technical architecture in deploying the NexaCore enterprise operations engine.",
      recipientId: createdEmployees[0].id,
      projectId: project1.id,
      issuerId: hrUser.id,
      pmSignature: "Asif Iqbal, Lead PM",
      hrSignature: "Jane Doe, Head of People"
    }
  });

  console.log("\n=======================================================");
  console.log("  DATABASE SUCCESSFULLY INITIALIZED WITH CLEAN DATA!  ");
  console.log("=======================================================");
  console.log("  🔑 Reference Login Credentials (Password: Password123):");
  console.log("  - HR Admin:        hr@worksync.com");
  console.log("  - Project Manager: asif.iqbal@nexacore.com");
  console.log("  - Developer:       abir.hasan@nexacore.com");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("[Database Reset Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
