import { UserRole, getRoleBadgeColor } from "@/types/roles";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  const roleLabels = {
    [UserRole.CITIZEN]: "Citizen",
    [UserRole.OFFICER]: "Officer",
    [UserRole.ADMIN]: "Admin",
    [UserRole.GOVERNMENT]: "Government",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      getRoleBadgeColor(role),
      className
    )}>
      {roleLabels[role]}
    </span>
  );
};
