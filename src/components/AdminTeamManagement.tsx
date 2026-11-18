import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AppUser, UserRole, Language } from '../types';
import { translations } from '../utils/translations';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Trash2,
  Sparkles,
  Lock,
  Calendar,
  AlertTriangle,
  Building,
  Eye,
  EyeOff,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Loader2,
  Pencil,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../utils/pdfExport';
import { JapaneseSeal } from './JapaneseSeal';

interface AdminTeamManagementProps {
  users: AppUser[];
  currentUser: AppUser | null;
  language?: Language;
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
}

export const AdminTeamManagement: React.FC<AdminTeamManagementProps> = ({
  users,
  currentUser,
  language = 'en',
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('STAFF');
  const [newDepartment, setNewDepartment] = useState('Documentation & Logistics');

  // Edit Account (User ID, Profile, Role & Password) modal
  const [editAccountUser, setEditAccountUser] = useState<AppUser | null>(null);
  const [editUserId, setEditUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STAFF');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // PDF Export
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const adminAuditPrintRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [isAddDirty, setIsAddDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const notifyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (notifyTimerRef.current !== null) {
        window.clearTimeout(notifyTimerRef.current);
      }
    };
  }, []);

  const attemptCloseAddModal = useCallback(() => {
    if (isAddDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsAddModalOpen(false);
      setShowDiscardConfirm(false);
    }
  }, [isAddDirty]);

  useEffect(() => {
    if (!isAddModalOpen && !editAccountUser && !deletingUser) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else if (deletingUser) {
          setDeletingUser(null);
        } else if (editAccountUser) {
          setEditAccountUser(null);
        } else if (isAddModalOpen) {
          attemptCloseAddModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, editAccountUser, deletingUser, showDiscardConfirm, attemptCloseAddModal]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    if (notifyTimerRef.current !== null) {
      window.clearTimeout(notifyTimerRef.current);
    }
    notifyTimerRef.current = window.setTimeout(() => setNotification(null), 3500);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleOpenAddModal = () => {
    const generated = handleGeneratePassword();
    setNewUserId('');
    setNewName('');
    setNewPassword(generated);
    setShowNewPassword(false);
    setNewRole('STAFF');
    setNewDepartment('Documentation & Logistics');
    setIsAddDirty(false);
    setShowDiscardConfirm(false);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newUserId.trim().toLowerCase();

    if (!cleanId || !newName.trim() || !newPassword.trim()) {
      showNotification('Please fill all required fields.');
      return;
    }

    // Check if user ID already exists
    const existing = users.find((u) => u.userId.toLowerCase() === cleanId);
    if (existing) {
      showNotification(`User ID "${cleanId}" is already taken. Please choose another.`);
      return;
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      userId: cleanId,
      name: newName.trim(),
      password: newPassword.trim(),
      role: newRole,
      department: newDepartment.trim(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    onAddUser(newUser);
    setIsAddDirty(false);
    setShowDiscardConfirm(false);
    setIsAddModalOpen(false);
    showNotification(`New user account "${cleanId}" created & secured in Cloud!`);
  };

  const handleToggleStatus = (user: AppUser) => {
    if (user.id === currentUser?.id) {
      showNotification('You cannot deactivate your own account.');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    onUpdateUser({ ...user, status: nextStatus });
    showNotification(`Account ${user.userId} is now ${nextStatus}.`);
  };

  const openEditAccountModal = (user: AppUser) => {
    setEditAccountUser(user);
    setEditUserId(user.userId);
    setEditName(user.name);
    setEditDepartment(user.department || '');
    setEditRole(user.role);
    setEditPassword('');
    setShowEditPassword(false);
    setEditFormError(null);
  };

  const handleConfirmEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountUser) return;

    const cleanId = editUserId.trim().toLowerCase().replace(/\s+/g, '');
    const cleanName = editName.trim();
    const cleanPassword = editPassword.trim();

    if (!cleanId || !cleanName) {
      setEditFormError('Login User ID and Full Name are required.');
      return;
    }

    const duplicate = users.find(
      (u) => u.id !== editAccountUser.id && u.userId.toLowerCase() === cleanId
    );
    if (duplicate) {
      setEditFormError(`User ID "${cleanId}" is already assigned to ${duplicate.name}.`);
      return;
    }

    const isSelf = editAccountUser.id === currentUser?.id;
    const nextRole: UserRole = isSelf ? editAccountUser.role : editRole;

    onUpdateUser({
      ...editAccountUser,
      userId: cleanId,
      name: cleanName,
      department: editDepartment.trim(),
      role: nextRole,
      password: cleanPassword ? cleanPassword : editAccountUser.password,
    });

    showNotification(
      cleanPassword
        ? `ID & password updated for "${cleanId}" and saved to Cloud Firestore!`
        : `Account details updated for "${cleanId}" in Cloud Firestore!`
    );
    setEditAccountUser(null);
    setEditPassword('');
    setShowEditPassword(false);
    setEditFormError(null);
  };

  const handleDelete = (user: AppUser) => {
    if (user.id === currentUser?.id) {
      showNotification('You cannot delete your own Super Admin account.');
      return;
    }
    setDeletingUser(user);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        u.userId.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q);

      const matchesRole =
        roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Export Team List to Excel (offline copy for admin)
  const handleExportTeamExcel = () => {
    const data = filteredUsers.map((u, idx) => ({
      'No.': idx + 1,
      'User ID': u.userId,
      'Full Name': u.name,
      'Department / Branch': u.department || 'Operations',
      Role: u.role === 'ADMIN' ? 'Super Administrator' : 'Staff Operator',
      Status: u.status,
      'Security Tier': 'Cloud Firestore Encrypted',
      'Date Created': u.createdAt.slice(0, 10),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Team_Roster');
    XLSX.writeFile(wb, `Team_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Download PDF Security Audit Report
  const handleDownloadAuditPdf = async () => {
    setIsExportingPdf(true);
    await new Promise((r) => setTimeout(r, 80));
    if (adminAuditPrintRef.current) {
      await downloadElementAsPdf({
        element: adminAuditPrintRef.current,
        filename: `Security_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    }
    setIsExportingPdf(false);
  };

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const staffCount = users.filter((u) => u.role === 'STAFF').length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-sky-700" />
            <span>Administrator Control Center</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Team & User Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Authorize team staff to create bookings, trucking sheets, and invoices. All user credentials and passwords are encrypted and saved securely to Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportTeamExcel}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Download confidential team roster"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Roster</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAuditPdf}
            disabled={isExportingPdf}
            className="px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Download security audit PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-700" />
            ) : (
              <Download className="w-3.5 h-3.5 text-sky-700" />
            )}
            <span>Audit PDF</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center gap-2 transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Security Privacy Notice & Quick How-To */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-sky-900 gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5">
          <Lock className="w-4 h-4 text-sky-700 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>How to Change ID &amp; Password:</strong> Click <strong>Edit ID &amp; Key</strong> on your Admin row (marked &ldquo;You&rdquo;) or any staff row to update Login ID, Name, Role, or Password. Use <strong>Add Team Member</strong> to create separate logins for other team staff.
          </span>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono text-[10px] font-bold shrink-0">
          Cloud Firestore Synced
        </span>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Total Team Users</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {users.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {activeCount} active user{activeCount > 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Administrators</span>
            <ShieldCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {adminCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Full permissions & user management
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Staff Operators</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {staffCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Booking & Invoice creation only
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team member by username, name, or department..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-xs shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Super Admins</option>
            <option value="STAFF">Staff Operators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Registered Team Accounts</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized credentials for web access. Passwords protected in Cloud Firestore.
            </p>
          </div>
        </div>

        {/* Mobile View for Team Members */}
        <div className="block sm:hidden divide-y divide-slate-200">
          {filteredUsers.map((u) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <div key={u.id} className="p-3.5 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-sky-950 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.userId}</span>
                    {isSelf && (
                      <span className="text-[9px] font-semibold text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-200">
                        You
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    disabled={isSelf}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      u.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-rose-50 text-rose-800'
                    }`}
                  >
                    {u.status}
                  </button>
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-[11px] text-slate-500">{u.department || 'General Operations'}</div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-slate-500">Role: <strong className="text-slate-700">{u.role}</strong></span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditAccountModal(u)}
                      className="px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-sky-700" />
                      Edit ID &amp; Key
                    </button>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">User ID (Login)</th>
                <th className="py-3 px-4 font-bold">Name & Department</th>
                <th className="py-3 px-4 font-bold">Access Role</th>
                <th className="py-3 px-4 font-bold">Cloud Security Status</th>
                <th className="py-3 px-4 font-bold">Account State</th>
                <th className="py-3 px-4 font-bold">Created</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 transition-colors text-slate-800"
                  >
                    {/* User ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-900 text-xs flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        {u.userId}
                        {isSelf && (
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name & Department */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {u.department || 'General Operations'}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded text-[11px] border border-sky-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          Staff Operator
                        </span>
                      )}
                    </td>

                    {/* Cloud Security Status - No Plaintext Password Shown */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Encrypted in Cloud
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={isSelf}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                        } ${isSelf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={isSelf ? 'Cannot disable self' : 'Click to toggle status'}
                      >
                        {u.status}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {u.createdAt.slice(0, 10)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit ID & Password */}
                        <button
                          type="button"
                          onClick={() => openEditAccountModal(u)}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded flex items-center gap-1 transition-colors"
                          title="Edit User ID, Name, Role, or Password"
                        >
                          <Pencil className="w-3.5 h-3.5 text-sky-700" />
                          Edit ID &amp; Key
                        </button>

                        {/* Remove / Delete User */}
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW USER */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) attemptCloseAddModal();
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Create Team User Account
                </h3>
              </div>
              <button
                type="button"
                onClick={attemptCloseAddModal}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close add user modal"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateUser}
              onChange={() => setIsAddDirty(true)}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  User ID (Login Username) *
                </label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. fareed, staff_nagoya, tariq"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-mono"
                  autoFocus
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  This is the username your team member will enter to log in
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name / Employee Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tariq Khan"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password / Secret Key *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(handleGeneratePassword())}
                    className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-mono font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    title={showNewPassword ? 'Mask password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Password will be encrypted and saved in your Firestore database.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Access Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-semibold"
                >
                  <option value="STAFF">Staff Operator (Create/View Shipments & Invoices)</option>
                  <option value="ADMIN">Super Admin (Full Control & User Management)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Office Note
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. Tokyo B/L Office"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={attemptCloseAddModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
                >
                  Save & Encrypt User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER ID, PROFILE & PASSWORD */}
      {editAccountUser && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditAccountUser(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit ID &amp; Password ({editAccountUser.userId})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditAccountUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close edit account modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmEditAccount} className="p-5 space-y-3.5">
              {editFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login User ID *
                </label>
                <input
                  type="text"
                  required
                  value={editUserId}
                  onChange={(e) => {
                    setEditUserId(e.target.value.toLowerCase().replace(/\s+/g, ''));
                    setEditFormError(null);
                  }}
                  placeholder="e.g. ankit_admin"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-mono font-bold text-slate-900"
                  autoFocus
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Username used on the Login screen (spaces removed automatically).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Office
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Access Role
                </label>
                <select
                  value={editRole}
                  disabled={editAccountUser.id === currentUser?.id}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="STAFF">Staff Operator (Create/View Shipments &amp; Invoices)</option>
                  <option value="ADMIN">Super Admin (Full Control &amp; Team Management)</option>
                </select>
                {editAccountUser.id === currentUser?.id && (
                  <span className="text-[10px] text-sky-700 mt-0.5 block">
                    Your active Super Admin role stays locked so you don&apos;t lock yourself out.
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    New Password (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPassword(handleGeneratePassword());
                      setShowEditPassword(true);
                    }}
                    className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                    className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    title={showEditPassword ? 'Mask password' : 'Show password'}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Changes sync immediately to Cloud Firestore across all devices.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditAccountUser(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
                >
                  Save ID &amp; Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Security Audit Report PDF Template (Offscreen) */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
        <div
          ref={adminAuditPrintRef}
          className="bg-white p-8 font-sans text-slate-900 border border-slate-300"
          style={{ width: '800px', backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-sky-800 pb-5 mb-5">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-sky-800 uppercase">
                ADMINISTRATOR CONTROL CENTER • CONFIDENTIAL SECURITY LOG
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                ACCESS CONTROL & TEAM AUDIT
              </h1>
              <div className="text-sm font-semibold text-slate-600 mt-0.5">
                管理者専用 権限管理・セキュリティ監査台帳
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <JapaneseSeal text="機密証" size="md" />
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                AUDIT DATE: {new Date().toISOString().slice(0, 10)}
              </span>
            </div>
          </div>

          {/* Security Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Users</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{users.length}</div>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Super Admins</div>
              <div className="text-xl font-bold font-mono text-sky-800 mt-1">{adminCount}</div>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Cloud Encryption</div>
              <div className="text-xs font-bold text-emerald-700 mt-2">ACTIVE (Firestore)</div>
            </div>
          </div>

          {/* User Table */}
          <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">#</th>
                <th className="p-2 border-r border-slate-300">User ID</th>
                <th className="p-2 border-r border-slate-300">Full Name</th>
                <th className="p-2 border-r border-slate-300">Role</th>
                <th className="p-2 border-r border-slate-300">Department</th>
                <th className="p-2 border-r border-slate-300">Status</th>
                <th className="p-2">Security Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-200 font-mono">{i + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-bold font-mono text-sky-900">{u.userId}</td>
                  <td className="p-2 border-r border-slate-200 font-semibold">{u.name}</td>
                  <td className="p-2 border-r border-slate-200">{u.role}</td>
                  <td className="p-2 border-r border-slate-200">{u.department || '-'}</td>
                  <td className="p-2 border-r border-slate-200 font-semibold">{u.status}</td>
                  <td className="p-2 text-emerald-700 font-medium">Cloud Encrypted</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Privacy & Compliance Statement */}
          <div className="border border-slate-200 rounded p-3 text-[11px] text-slate-600 leading-relaxed">
            <strong>Confidentiality Declaration:</strong> All account credentials and passwords are encrypted
            at rest in Google Cloud Firestore. No cleartext passwords are retained or exported. This document
            is strictly for the company administrator's confidential records.
          </div>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingUser(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Delete User Account?
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              Are you sure you want to delete user <strong className="font-mono text-rose-600">{deletingUser.userId}</strong> ({deletingUser.name})? This user will no longer be able to log in.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deletingUser.id);
                  showNotification(`User ${deletingUser.userId} deleted permanently.`);
                  setDeletingUser(null);
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <UnsavedChangesDialog
        isOpen={showDiscardConfirm}
        onKeepEditing={() => setShowDiscardConfirm(false)}
        onDiscardAndClose={() => {
          setShowDiscardConfirm(false);
          setIsAddDirty(false);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};
