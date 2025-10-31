export enum UserRole {
  CITIZEN = 'citizen',
  OFFICER = 'officer',
  ADMIN = 'admin',
  GOVERNMENT = 'government'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  isApproved?: boolean;
}

export const rolePermissions = {
  [UserRole.CITIZEN]: {
    canFileComplaint: true,
    canTrackComplaints: true,
    canUpvote: true,
    canViewPublicFeed: true,
    canUpdateComplaintStatus: false,
    canManageUsers: false,
    canViewAnalytics: false,
  },
  [UserRole.OFFICER]: {
    canFileComplaint: true,
    canTrackComplaints: true,
    canUpvote: false,
    canViewPublicFeed: true,
    canUpdateComplaintStatus: true,
    canManageUsers: false,
    canViewAnalytics: true,
  },
  [UserRole.ADMIN]: {
    canFileComplaint: true,
    canTrackComplaints: true,
    canUpvote: false,
    canViewPublicFeed: true,
    canUpdateComplaintStatus: true,
    canManageUsers: true,
    canViewAnalytics: true,
  },
  [UserRole.GOVERNMENT]: {
    canFileComplaint: false,
    canTrackComplaints: true,
    canUpvote: false,
    canViewPublicFeed: true,
    canUpdateComplaintStatus: false,
    canManageUsers: false,
    canViewAnalytics: true,
  },
};

export const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case UserRole.CITIZEN:
      return 'bg-primary text-primary-foreground';
    case UserRole.OFFICER:
      return 'bg-secondary text-secondary-foreground';
    case UserRole.ADMIN:
      return 'bg-accent text-accent-foreground';
    case UserRole.GOVERNMENT:
      return 'bg-status-processing text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
