import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Users, UserCheck, UserX, Edit } from "lucide-react";
import { ROLES } from '@/services/roleService';

interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  approval_status: string;
  created_at: string;
}

interface ApprovedUser {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  role: string;
  approved_at: string;
}

const UserManagement: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [selectedApprovedUser, setSelectedApprovedUser] = useState<ApprovedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use the RPC function to get all users with their details
      const { data: allUsers, error } = await (supabase as any)
        .rpc('get_all_users_for_admin');

      if (error) throw error;

      // Separate pending and approved users
      const pending = (allUsers || [])
        .filter((u: any) => u.approval_status === 'pending')
        .map((u: any) => ({
          id: u.user_id,
          email: u.email,
          full_name: u.full_name,
          department: u.department,
          approval_status: u.approval_status,
          created_at: u.created_at
        }));

      const approved = (allUsers || [])
        .filter((u: any) => u.approval_status === 'approved')
        .map((u: any) => ({
          id: u.user_id,
          email: u.email,
          full_name: u.full_name,
          department: u.department,
          role: u.role || 'none',
          approved_at: u.approved_at
        }));

      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = (user: PendingUser) => {
    setSelectedUser(user);
    setShowApprovalDialog(true);
  };

  const handleReject = (user: PendingUser) => {
    setSelectedUser(user);
    setShowRejectionDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).rpc('approve_user_with_role', {
        _user_id: selectedUser.id,
        _role: selectedRole.toLowerCase(),
        _approved_by: user.id
      });

      if (error) throw error;

      toast({
        title: "User Approved",
        description: `${selectedUser.email} has been approved with ${selectedRole} role`
      });

      setShowApprovalDialog(false);
      setSelectedUser(null);
      setSelectedRole('');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive"
      });
    }
  };

  const confirmRejection = async () => {
    if (!selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).rpc('reject_user', {
        _user_id: selectedUser.id,
        _rejection_reason: rejectionReason,
        _rejected_by: user.id
      });

      if (error) throw error;

      toast({
        title: "User Rejected",
        description: `${selectedUser.email} registration has been rejected`
      });

      setShowRejectionDialog(false);
      setSelectedUser(null);
      setRejectionReason('');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive"
      });
    }
  };

  const handleChangeRole = (user: ApprovedUser) => {
    setSelectedApprovedUser(user);
    setSelectedRole(user.role);
    setShowChangeRoleDialog(true);
  };

  const confirmChangeRole = async () => {
    if (!selectedApprovedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).rpc('change_user_role', {
        _user_id: selectedApprovedUser.id,
        _new_role: selectedRole.toLowerCase(),
        _changed_by: user.id
      });

      if (error) throw error;

      toast({
        title: "Role Changed",
        description: `${selectedApprovedUser.email}'s role has been changed to ${selectedRole}`
      });

      setShowChangeRoleDialog(false);
      setSelectedApprovedUser(null);
      setSelectedRole('');
      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: "Error",
        description: "Failed to change user role",
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: pendingUsers.length + approvedUsers.length,
    pending: pendingUsers.length,
    approved: approvedUsers.length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">Manage system users and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Administrator accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">New user requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users Table */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Users waiting for admin approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(user)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(user)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Users</CardTitle>
          <CardDescription>Active system users with assigned roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <Badge>{user.role.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleChangeRole(user)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Change Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User</DialogTitle>
            <DialogDescription>
              Assign a role to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.CEO}>CEO</SelectItem>
                  <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                  <SelectItem value={ROLES.HR}>HR</SelectItem>
                  <SelectItem value={ROLES.MARKETING}>Marketing</SelectItem>
                  <SelectItem value={ROLES.ACCOUNTS}>Accounts</SelectItem>
                  <SelectItem value={ROLES.COACH}>Coach</SelectItem>
                  <SelectItem value={ROLES.GOVERNANCE}>Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApproval} disabled={!selectedRole}>
              Approve & Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejection}>
              Reject User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedApprovedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Role: <Badge>{selectedApprovedUser?.role.toUpperCase()}</Badge></label>
              <div className="mt-2">
                <label className="text-sm font-medium">New Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLES.CEO}>CEO</SelectItem>
                    <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                    <SelectItem value={ROLES.HR}>HR</SelectItem>
                    <SelectItem value={ROLES.MARKETING}>Marketing</SelectItem>
                    <SelectItem value={ROLES.ACCOUNTS}>Accounts</SelectItem>
                    <SelectItem value={ROLES.COACH}>Coach</SelectItem>
                    <SelectItem value={ROLES.GOVERNANCE}>Governance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmChangeRole} disabled={!selectedRole || selectedRole === selectedApprovedUser?.role}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
