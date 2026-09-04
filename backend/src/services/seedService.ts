import { PrismaClient, ExpenseCategory, ExpenseStatus, CertificateType, PollTarget, PollStatus, GrievanceCategory, GrievanceStatus, BookingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function runDatabaseSeed() {
  console.log("[Seeder] Starting comprehensive database purge and seeding...");

  const defaultPassword = "Password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // ---------------------------------------------------------
  // 1. PURGE ALL COLLECTIONS
  // ---------------------------------------------------------
  await prisma.knowledgeDocument.deleteMany({});
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

  console.log("[Seeder] Collections purged cleanly.");

  // ---------------------------------------------------------
  // 2. PROVISION USERS (HR, PM, DEVELOPER, BANGLADESHI STAFF)
  // ---------------------------------------------------------
  // 2.1 HR Administrator (abir@nexacore.com)
  const hrUser = await prisma.user.create({
    data: {
      name: "Abir Hasan",
      email: "abir@nexacore.com",
      emailVerified: true,
      role: "HR",
      department: "People Operations & Governance",
      designation: "Head of People & HR Operations",
      phone: "+880 1711-889900",
      bio: "Overseeing workforce growth, financial settlements, organizational policies, and corporate culture.",
      documentsUrl: "https://drive.google.com/drive/folders/nexacore-abir-hr-docs"
    }
  });

  await prisma.account.create({
    data: {
      userId: hrUser.id,
      providerId: "credential",
      accountId: "abir@nexacore.com",
      password: hashedPassword
    }
  });

  // 2.2 Project Manager (arefin@nexacore.com)
  const pmUser = await prisma.user.create({
    data: {
      name: "Arefin Ahmed",
      email: "arefin@nexacore.com",
      emailVerified: true,
      role: "PROJECT_MANAGER",
      department: "Software Engineering",
      designation: "Senior Technical Project Manager",
      phone: "+880 1819-223344",
      bio: "Leading full-stack engineering squads across agile sprints, rapid API delivery, and cloud infrastructure.",
      documentsUrl: "https://drive.google.com/drive/folders/nexacore-arefin-pm-docs"
    }
  });

  await prisma.account.create({
    data: {
      userId: pmUser.id,
      providerId: "credential",
      accountId: "arefin@nexacore.com",
      password: hashedPassword
    }
  });

  // 2.3 Lead Developer (mamun@nexacore.com)
  const devMamun = await prisma.user.create({
    data: {
      name: "Abdullah Al Mamun",
      email: "mamun@nexacore.com",
      emailVerified: true,
      role: "EMPLOYEE",
      department: "Software Engineering",
      designation: "Lead Full-Stack Developer",
      phone: "+880 1912-334455",
      bio: "Specializing in Next.js, Express microservices, Prisma ORM, and high-concurrency payment integrations.",
      documentsUrl: "https://drive.google.com/drive/folders/nexacore-mamun-dev-docs"
    }
  });

  await prisma.account.create({
    data: {
      userId: devMamun.id,
      providerId: "credential",
      accountId: "mamun@nexacore.com",
      password: hashedPassword
    }
  });

  // 2.4 Additional Bangladeshi Workforce
  const additionalStaff = [
    {
      name: "Nusrat Jahan",
      email: "nusrat.jahan@nexacore.com",
      dept: "Frontend Engineering",
      desig: "Senior Frontend Engineer (React/Next.js)",
      phone: "+880 1611-445566",
      bio: "Building accessible UI components and reactive design systems."
    },
    {
      name: "Farhan Kabir",
      email: "farhan.kabir@nexacore.com",
      dept: "Backend & Systems",
      desig: "Senior Backend Engineer (Node/MongoDB)",
      phone: "+880 1712-556677",
      bio: "Focusing on distributed database transactions and Redis caching."
    },
    {
      name: "Sadia Islam",
      email: "sadia.islam@nexacore.com",
      dept: "Product Design",
      desig: "Lead UI/UX & Product Designer",
      phone: "+880 1513-667788",
      bio: "Crafting modern, intuitive design systems and user journey flows."
    },
    {
      name: "Tanvir Rahman",
      email: "tanvir.rahman@nexacore.com",
      dept: "DevOps & Infrastructure",
      desig: "DevOps & Site Reliability Engineer",
      phone: "+880 1814-778899",
      bio: "Automating CI/CD pipelines, Docker containers, and Kubernetes clusters."
    },
    {
      name: "Mehzabin Chowdhury",
      email: "mehzabin.c@nexacore.com",
      dept: "Quality Assurance",
      desig: "Senior QA Automation Engineer",
      phone: "+880 1915-889900",
      bio: "Leading automated end-to-end integration and load testing suites."
    }
  ];

  const createdStaff: any[] = [];
  for (const staff of additionalStaff) {
    const user = await prisma.user.create({
      data: {
        name: staff.name,
        email: staff.email,
        emailVerified: true,
        role: "EMPLOYEE",
        department: staff.dept,
        designation: staff.desig,
        phone: staff.phone,
        bio: staff.bio,
        documentsUrl: `https://drive.google.com/drive/folders/nexacore-${staff.email.split("@")[0]}-docs`
      }
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: staff.email,
        password: hashedPassword
      }
    });

    createdStaff.push(user);
  }

  const allDevUsers = [devMamun, ...createdStaff];
  const allUserIds = [hrUser.id, pmUser.id, ...allDevUsers.map(u => u.id)];

  // ---------------------------------------------------------
  // 3. PROVISION BANGLADESHI ENTERPRISE PROJECTS
  // ---------------------------------------------------------
  // Project 1: ACTIVE - Dhaka Metro Smart RapidPass Ticketing API
  const metroProject = await prisma.project.create({
    data: {
      name: "Dhaka Metro Smart RapidPass Ticketing API",
      description: "High-throughput NFC and QR-based automated fare collection engine with real-time station gate synchronization.",
      status: "ACTIVE",
      priority: "HIGH",
      budget: 850000,
      payoutBonus: 25000,
      managerId: pmUser.id,
      employeeIds: [devMamun.id, createdStaff[0].id, createdStaff[1].id, createdStaff[3].id],
      startDate: new Date("2026-08-01T00:00:00Z"),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      category: "Public Transportation FinTech",
      client: "Dhaka Mass Transit Company Limited (DMTCL)"
    }
  });

  // Project 2: PENDING_SETTLEMENT - bKash & Nagad Unified MFS Payment Gateway
  const mfsProject = await prisma.project.create({
    data: {
      name: "bKash & Nagad Unified MFS Payment Gateway",
      description: "Omni-channel merchant checkout gateway with instant IPN webhook verification and automated tokenized refunds.",
      status: "PENDING_SETTLEMENT",
      priority: "HIGH",
      budget: 650000,
      payoutBonus: 20000,
      managerId: pmUser.id,
      employeeIds: [devMamun.id, createdStaff[1].id, createdStaff[4].id],
      startDate: new Date("2026-07-01T00:00:00Z"),
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      category: "FinTech & MFS",
      client: "FinTech Alliance Bangladesh"
    }
  });

  // Project 3: ACTIVE - Chaldal Automated Cold-Chain Logistics Hub
  const chaldalProject = await prisma.project.create({
    data: {
      name: "Chaldal Automated Cold-Chain Logistics Hub",
      description: "IoT-enabled warehouse temperature telemetry and dynamic delivery fleet route optimization across Dhaka division.",
      status: "ACTIVE",
      priority: "HIGH",
      budget: 520000,
      payoutBonus: 15000,
      managerId: pmUser.id,
      employeeIds: [createdStaff[0].id, createdStaff[2].id, createdStaff[3].id],
      startDate: new Date("2026-08-15T00:00:00Z"),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      category: "IoT & Supply Chain",
      client: "Chaldal Logistics"
    }
  });

  // Project 4: COMPLETED - BRAC Microfinance Digital Disbursement Portal
  const bracProject = await prisma.project.create({
    data: {
      name: "BRAC Microfinance Digital Disbursement Portal",
      description: "Biometric e-KYC validation and instant rural loan disbursement platform supporting offline sync for field officers.",
      status: "COMPLETED",
      priority: "MEDIUM",
      budget: 780000,
      payoutApproved: true,
      payoutBonus: 30000,
      managerId: pmUser.id,
      employeeIds: [devMamun.id, createdStaff[0].id, createdStaff[1].id],
      startDate: new Date("2026-06-01T00:00:00Z"),
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      category: "Microfinance & Social Impact",
      client: "BRAC International"
    }
  });

  // Project 5: PENDING - Banglalink 4G Traffic Optimization System
  const banglalinkProject = await prisma.project.create({
    data: {
      name: "Banglalink 4G Traffic Optimization System",
      description: "AI-driven cellular band traffic redistribution during Dhaka peak hours to prevent regional network congestion.",
      status: "PENDING",
      priority: "HIGH",
      budget: 920000,
      payoutBonus: 28000,
      managerId: pmUser.id,
      employeeIds: [devMamun.id, createdStaff[3].id, createdStaff[4].id],
      startDate: new Date("2026-09-01T00:00:00Z"),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      category: "Telecommunications & AI",
      client: "VEON / Banglalink"
    }
  });

  // ---------------------------------------------------------
  // 4. KANBAN TASKS FOR ACTIVE PROJECTS
  // ---------------------------------------------------------
  const taskData = [
    // Dhaka Metro Tasks
    {
      title: "Implement NFC RapidPass Tap-and-Go Reader Protocol",
      description: "Integrate ISO 14443 Type A/B smart card interface with sub-100ms response time for station turnstiles.\n\n### Requirements\n- Zero latency buffer\n- Encrypted AES-256 payload handshake\n- Fallback offline ledger sync",
      column: "COMPLETED",
      projectId: metroProject.id,
      assigneeId: devMamun.id
    },
    {
      title: "Real-Time Station Turnstile WebSocket Gate Daemon",
      description: "Build distributed WebSocket server cluster to broadcast gate open/close events across 16 stations concurrently.",
      column: "IN_PROGRESS",
      projectId: metroProject.id,
      assigneeId: createdStaff[1].id
    },
    {
      title: "Next.js Commuter Balance & Journey History Dashboard",
      description: "Design reactive user portal for Dhaka metro commuters to top up RapidPass and inspect transaction receipts.",
      column: "TESTING",
      projectId: metroProject.id,
      assigneeId: createdStaff[0].id
    },
    {
      title: "Load Test 50,000 Concurrent Passenger Swipes (k6)",
      description: "Simulate peak rush hour at Motijheel and Uttara North stations with automated stress testing scripts.",
      column: "TODO",
      projectId: metroProject.id,
      assigneeId: createdStaff[3].id
    },

    // Chaldal Logistics Tasks
    {
      title: "IoT Temperature Sensor Telemetry Ingestion Pipeline",
      description: "Subscribe to MQTT topics emitted by chilled delivery vans and trigger alerts if temp exceeds 4°C.",
      column: "IN_PROGRESS",
      projectId: chaldalProject.id,
      assigneeId: createdStaff[0].id
    },
    {
      title: "Dhaka Traffic Aware Fleet Routing Algorithm",
      description: "Calculate optimal delivery sequences factoring real-time road congestion in Gulshan, Dhanmondi, and Mirpur.",
      column: "COMPLETED",
      projectId: chaldalProject.id,
      assigneeId: createdStaff[2].id
    },
    {
      title: "Automated Dispatch Push Notifications Service",
      description: "Send SMS and mobile push alerts to customers when dispatch vehicle is within 1.5km of delivery address.",
      column: "TODO",
      projectId: chaldalProject.id,
      assigneeId: createdStaff[3].id
    }
  ];

  for (const t of taskData) {
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        column: t.column,
        projectId: t.projectId,
        assigneeId: t.assigneeId
      }
    });
  }

  // ---------------------------------------------------------
  // 5. PROJECT CHAT CHANNELS & MESSAGES
  // ---------------------------------------------------------
  const defaultChannels = ["general", "sprint-updates", "deployments"];
  for (const proj of [metroProject, mfsProject, chaldalProject]) {
    for (const chName of defaultChannels) {
      const channel = await prisma.channel.create({
        data: {
          name: chName,
          projectId: proj.id
        }
      });

      if (chName === "general") {
        await prisma.message.create({
          data: {
            content: `Salam team! Welcome to the workspace for **${proj.name}**. Let's keep all architecture decisions and updates logged here.`,
            senderId: pmUser.id,
            channelId: channel.id
          }
        });
        await prisma.message.create({
          data: {
            content: "Ready to push the sprint deliverables! Reviewing the API specifications now.",
            senderId: devMamun.id,
            channelId: channel.id
          }
        });
      } else if (chName === "sprint-updates") {
        await prisma.message.create({
          data: {
            content: "Daily Standup: Completed core backend integration. Moving to staging verification today.",
            senderId: devMamun.id,
            channelId: channel.id
          }
        });
      }
    }
  }

  // ---------------------------------------------------------
  // 6. GEOFENCED ATTENDANCE LOGS (BRAC University Campus)
  // ---------------------------------------------------------
  const pastDays = [
    "2026-08-31",
    "2026-09-01",
    "2026-09-02",
    "2026-09-03"
  ];

  for (const dateStr of pastDays) {
    for (const user of [hrUser, pmUser, devMamun, createdStaff[0], createdStaff[1]]) {
      const isLate = Math.random() > 0.8;
      const startHour = isLate ? 9 : 8;
      const startMin = isLate ? 25 : 50;
      const clockIn = new Date(`${dateStr}T0${startHour}:${startMin}:00+06:00`);
      const clockOut = new Date(`${dateStr}T17:30:00+06:00`);
      const hoursWorked = 8.5;

      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: dateStr,
          clockIn,
          clockOut,
          hoursWorked,
          isLate
        }
      });
    }
  }

  // ---------------------------------------------------------
  // 7. LEAVE & REMOTE WORK (WFH) APPLICATIONS
  // ---------------------------------------------------------
  const leaveData = [
    {
      userId: devMamun.id,
      type: "LEAVE",
      startDate: new Date("2026-10-15T00:00:00Z"),
      endDate: new Date("2026-10-18T00:00:00Z"),
      reason: "Family vacation to Cox's Bazar and annual family reunion.",
      status: "PENDING"
    },
    {
      userId: createdStaff[0].id,
      type: "WFH",
      startDate: new Date("2026-09-08T00:00:00Z"),
      endDate: new Date("2026-09-09T00:00:00Z"),
      reason: "Heavy monsoon waterlogging in Mirpur road; working remotely with high-speed fiber.",
      status: "PENDING"
    },
    {
      userId: createdStaff[1].id,
      type: "LEAVE",
      startDate: new Date("2026-08-20T00:00:00Z"),
      endDate: new Date("2026-08-22T00:00:00Z"),
      reason: "Medical appointment and fever recovery.",
      status: "APPROVED",
      approverId: hrUser.id,
      comment: "Approved. Take rest and get well soon!"
    },
    {
      userId: createdStaff[2].id,
      type: "WFH",
      startDate: new Date("2026-08-12T00:00:00Z"),
      endDate: new Date("2026-08-12T00:00:00Z"),
      reason: "Home internet fiber installation and power maintenance.",
      status: "APPROVED",
      approverId: pmUser.id,
      comment: "Approved. Please remain reachable on Slack."
    }
  ];

  for (const l of leaveData) {
    await prisma.leaveRequest.create({
      data: l as any
    });
  }

  // ---------------------------------------------------------
  // 8. PAYROLL RECORDS & PAYSLIPS (BDT Monthly Salaries)
  // ---------------------------------------------------------
  const payrollList = [
    {
      user: hrUser,
      base: 140000,
      bonus: 25000,
      deductions: 8000,
      month: "2026-08",
      status: "PAID"
    },
    {
      user: pmUser,
      base: 130000,
      bonus: 20000,
      deductions: 7500,
      month: "2026-08",
      status: "PAID"
    },
    {
      user: devMamun,
      base: 110000,
      bonus: 15000,
      deductions: 6000,
      month: "2026-08",
      status: "PAID"
    },
    {
      user: createdStaff[0],
      base: 85000,
      bonus: 10000,
      deductions: 4500,
      month: "2026-08",
      status: "PAID"
    },
    {
      user: createdStaff[1],
      base: 90000,
      bonus: 12000,
      deductions: 5000,
      month: "2026-08",
      status: "PENDING"
    },
    {
      user: createdStaff[2],
      base: 75000,
      bonus: 8000,
      deductions: 3500,
      month: "2026-08",
      status: "PENDING"
    }
  ];

  for (const p of payrollList) {
    const netSalary = p.base + p.bonus - p.deductions;
    await prisma.payroll.create({
      data: {
        userId: p.user.id,
        month: p.month,
        baseSalary: p.base,
        bonus: p.bonus,
        deductions: p.deductions,
        netSalary,
        status: p.status,
        paidAt: p.status === "PAID" ? new Date("2026-08-31T00:00:00Z") : null
      }
    });
  }

  // ---------------------------------------------------------
  // 9. LOAN APPLICATIONS (Provident Fund & Festival Advance)
  // ---------------------------------------------------------
  const loans = [
    {
      userId: devMamun.id,
      amount: 150000,
      installments: 12,
      installmentsPaid: 2,
      monthlyRepayment: 12500,
      reason: "Apartment advance and moving costs in Dhanmondi.",
      status: "APPROVED",
      comment: "Approved under corporate employee welfare fund."
    },
    {
      userId: createdStaff[1].id,
      amount: 80000,
      installments: 8,
      installmentsPaid: 0,
      monthlyRepayment: 10000,
      reason: "Higher education tuition fees for professional certification.",
      status: "PENDING",
      comment: null
    }
  ];

  for (const loan of loans) {
    await prisma.loan.create({
      data: loan
    });
  }

  // ---------------------------------------------------------
  // 10. PERFORMANCE EVALUATIONS
  // ---------------------------------------------------------
  await prisma.evaluation.create({
    data: {
      userId: devMamun.id,
      pmId: pmUser.id,
      rating: 5,
      feedback: "Outstanding architecture execution on the Dhaka Metro RapidPass engine. Proactive problem solver with high code standards and great team mentorship."
    }
  });

  await prisma.evaluation.create({
    data: {
      userId: createdStaff[0].id,
      pmId: pmUser.id,
      rating: 4,
      feedback: "Great work delivering the commuter dashboard with high responsiveness and accessibility standards."
    }
  });

  // ---------------------------------------------------------
  // 11. MEETING ROOMS & RESERVATIONS
  // ---------------------------------------------------------
  const room1 = await prisma.meetingRoom.create({
    data: {
      name: "Sundarbans Executive Boardroom",
      floor: "Level 11 (East Wing)",
      capacity: 18,
      amenities: ["4K Video Conference Screen", "Dual Whiteboard", "Dolby Voice Audio", "High-Speed Fiber HDMI"],
      status: "AVAILABLE"
    }
  });

  const room2 = await prisma.meetingRoom.create({
    data: {
      name: "Padma Conference Hall",
      floor: "Level 11 (West Wing)",
      capacity: 12,
      amenities: ["Smart Projector", "Conference Mic", "Whiteboard"],
      status: "AVAILABLE"
    }
  });

  const room3 = await prisma.meetingRoom.create({
    data: {
      name: "Jamuna Agile Huddle Space",
      floor: "Level 10 (Central Pod)",
      capacity: 6,
      amenities: ["55-inch Standup Screen", "Miro Board Station"],
      status: "AVAILABLE"
    }
  });

  await prisma.roomBooking.create({
    data: {
      roomId: room1.id,
      userId: pmUser.id,
      title: "Dhaka Metro Sprint Planning & Architecture Review",
      description: "Quarterly alignment with engineering leads and QA engineers.",
      date: "2026-09-04",
      startTime: "11:00",
      endTime: "12:30",
      attendees: 10,
      status: BookingStatus.APPROVED
    }
  });

  await prisma.roomBooking.create({
    data: {
      roomId: room3.id,
      userId: devMamun.id,
      title: "RapidPass Token Security Sync",
      description: "Reviewing token encryption payload with backend team.",
      date: "2026-09-05",
      startTime: "14:00",
      endTime: "15:00",
      attendees: 4,
      status: BookingStatus.PENDING
    }
  });

  // ---------------------------------------------------------
  // 12. POLLS & SURVEYS
  // ---------------------------------------------------------
  const poll1 = await prisma.poll.create({
    data: {
      title: "Annual Engineering Retreat Destination for Winter 2026",
      description: "Vote for your preferred destination for our 3-day company hackathon and annual relaxation retreat.",
      status: PollStatus.ACTIVE,
      target: PollTarget.COMPANY_WIDE,
      authorId: hrUser.id,
      options: {
        create: [
          { text: "Sreemangal Tea Gardens & Nature Resort" },
          { text: "Sajek Valley Eco Cottage Over the Clouds" },
          { text: "Cox's Bazar Sea Beach & Oceanfront Resort" }
        ]
      }
    },
    include: {
      options: true
    }
  });

  // Cast sample votes on poll
  if (poll1.options.length > 1) {
    await prisma.pollVote.create({
      data: {
        pollId: poll1.id,
        optionId: poll1.options[1].id,
        userId: devMamun.id
      }
    });
    await prisma.pollVote.create({
      data: {
        pollId: poll1.id,
        optionId: poll1.options[0].id,
        userId: pmUser.id
      }
    });
  }

  // ---------------------------------------------------------
  // 13. GRIEVANCES & WORKPLACE FEEDBACK
  // ---------------------------------------------------------
  await prisma.grievance.create({
    data: {
      title: "Flexible Shift Window during Heavy Rain / Waterlogged Dhaka Traffic",
      description: "Requesting a 30-minute grace window for morning check-ins during monsoon season when Mohakhali and Kuril flyovers face extreme traffic.",
      category: GrievanceCategory.OTHER,
      userId: devMamun.id,
      status: GrievanceStatus.UNDER_INVESTIGATION,
      resolutionNote: "HR is reviewing this with leadership to introduce an automatic rainy-day geofence flex schedule."
    }
  });

  await prisma.grievance.create({
    data: {
      title: "Addition of Healthy Snacks in 10th Floor Cafeteria Pantry",
      description: "Would love to have fresh seasonal fruits (mango, banana) and sugar-free beverage options in the pantry.",
      category: GrievanceCategory.OTHER,
      userId: createdStaff[0].id,
      status: GrievanceStatus.RESOLVED,
      resolutionNote: "Pantry vendor has been updated to deliver fresh fruit crates every Monday & Wednesday."
    }
  });

  // ---------------------------------------------------------
  // 14. CENTRALIZED KNOWLEDGE BASE & POLICY DOCUMENTS
  // ---------------------------------------------------------
  const knowledgeDocs = [
    {
      title: "NexaCore Employee Handbook & Bangladesh Labor Act 2006 Summary",
      category: "POLICY",
      fileUrl: "https://drive.google.com/file/d/nexacore-employee-handbook-bd-labor-act/view",
      description: "Comprehensive guide covering employment terms, working hours, festival holidays, leave entitlements, and code of professional conduct.",
      authorId: hrUser.id
    },
    {
      title: "Next.js, Node.js & TypeScript Engineering Standards (2026)",
      category: "CODING_GUIDELINES",
      fileUrl: "https://drive.google.com/file/d/nexacore-engineering-coding-guidelines-ts/view",
      description: "Standard architectural patterns, REST API schema definitions, ESLint/Prettier rules, and PR review checklists across all engineering teams.",
      authorId: hrUser.id
    },
    {
      title: "Dhaka Metro NFC Smart Card & Microservices Architecture Spec",
      category: "PROJECT_DOCS",
      fileUrl: "https://drive.google.com/file/d/nexacore-dhaka-metro-architecture-spec/view",
      description: "End-to-end technical specification for RapidPass cryptographic token generation and fault-tolerant station gateway communication.",
      authorId: hrUser.id
    },
    {
      title: "New Joiner 30-60-90 Day Onboarding Roadmap",
      category: "ONBOARDING",
      fileUrl: "https://drive.google.com/file/d/nexacore-new-joiner-onboarding-roadmap/view",
      description: "Step-by-step technical onboarding checklist, local workstation setup guide, VPN credentials, and mentor assignment details.",
      authorId: hrUser.id
    }
  ];

  for (const doc of knowledgeDocs) {
    await prisma.knowledgeDocument.create({
      data: doc
    });
  }

  // ---------------------------------------------------------
  // 15. DIGITAL COMPLETION CERTIFICATES
  // ---------------------------------------------------------
  await prisma.certificate.create({
    data: {
      certificateCode: "NEXA-CERT-2026-BRAC-001",
      title: "Excellence in Microfinance FinTech Engineering",
      recipientId: devMamun.id,
      projectId: bracProject.id,
      issuerId: hrUser.id,
      type: CertificateType.PROJECT_COMPLETION,
      description: "Issued for exceptional contributions to the BRAC Microfinance Digital Disbursement Portal.",
      issuedAt: new Date("2026-08-25T00:00:00Z"),
      pmSignature: "Arefin Ahmed (Technical PM)",
      hrSignature: "Abir Hasan (Head of People)"
    }
  });

  await prisma.certificate.create({
    data: {
      certificateCode: "NEXA-CERT-2026-BRAC-002",
      title: "Outstanding Technical Project Management",
      recipientId: pmUser.id,
      projectId: bracProject.id,
      issuerId: hrUser.id,
      type: CertificateType.PROJECT_COMPLETION,
      description: "Issued for exceptional project delivery and agile management on the BRAC Microfinance Portal.",
      issuedAt: new Date("2026-08-25T00:00:00Z"),
      pmSignature: "Arefin Ahmed (Technical PM)",
      hrSignature: "Abir Hasan (Head of People)"
    }
  });

  // ---------------------------------------------------------
  // 16. COMPANY ANNOUNCEMENTS & NOTIFICATIONS
  // ---------------------------------------------------------
  await prisma.announcement.create({
    data: {
      title: "Upcoming Holiday Notice: Eid-ul-Adha Office Schedule",
      content: "Please be advised that the NexaCore Dhaka headquarters will remain closed from June 16 to June 20 for Eid-ul-Adha. On-call emergency engineering rotations remain active for 24/7 client systems.",
      authorId: hrUser.id
    }
  });

  await prisma.announcement.create({
    data: {
      title: "Annual Health Insurance & Medical Benefit Renewal",
      content: "All full-time staff members are eligible for our upgraded corporate health coverage. Please verify your family dependent details with HR before the end of the month.",
      authorId: hrUser.id
    }
  });

  // Notifications for core users
  await prisma.notification.create({
    data: {
      userId: devMamun.id,
      title: "New Project Assigned",
      message: "You have been assigned to 'Dhaka Metro Smart RapidPass Ticketing API'. Check your Kanban board.",
      type: "PROJECT",
      link: "/dashboard/active-projects"
    }
  });

  await prisma.notification.create({
    data: {
      userId: hrUser.id,
      title: "Project Settlement Pending",
      message: "'bKash & Nagad Unified MFS Payment Gateway' was marked as completed and awaits financial payout settlement.",
      type: "PROJECT",
      link: "/dashboard/active-projects"
    }
  });

  console.log("[Seeder] Successfully seeded all collections with rich Bangladeshi context!");

  return {
    users: [
      { role: "HR Administrator", name: "Abir Hasan", email: "abir@nexacore.com", password: "Password123" },
      { role: "Project Manager", name: "Arefin Ahmed", email: "arefin@nexacore.com", password: "Password123" },
      { role: "Lead Developer", name: "Abdullah Al Mamun", email: "mamun@nexacore.com", password: "Password123" }
    ],
    summary: {
      totalUsers: allUserIds.length,
      totalProjects: 5,
      totalTasks: taskData.length,
      totalKnowledgeDocs: knowledgeDocs.length
    }
  };
}
