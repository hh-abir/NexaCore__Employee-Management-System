import Link from "next/link";
import { Workflow, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          
          <div className="col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.jpg" alt="NexaCore Logo" className="w-8 h-8 rounded-xl object-cover border border-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  NexaCore
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  EMS
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed font-medium">
              Enterprise operations and employee management platform built for modern, agile engineering and people operations teams.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Core Modules
            </h3>
            <ul className="space-y-3 text-xs font-medium text-slate-500">
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  GPS Check-In & Attendance
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Sprint Kanban Boards
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  BDT Payroll & Payslips
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Corporate Knowledge Base
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3 text-xs font-medium text-slate-500">
              <li>
                <a href="#demo-accounts" className="hover:text-indigo-600 transition-colors">
                  Demo Test Accounts
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Role-Based Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Digital Certificates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Compliance
            </h3>
            <ul className="space-y-3 text-xs font-medium text-slate-500">
              <li>
                <span>
                  Bangladesh Labor Act 2006
                </span>
              </li>
              <li>
                <span>
                  Provident Fund Welfare Rules
                </span>
              </li>
              <li>
                <span>
                  Cryptographic Certs (HMAC)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium">
            &copy; 2026 NexaCore Employee Management System. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs text-slate-400 font-medium">
            <span>Next.js 16</span>
            <span>&bull;</span>
            <span>Express TypeScript</span>
            <span>&bull;</span>
            <span>Prisma ORM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
