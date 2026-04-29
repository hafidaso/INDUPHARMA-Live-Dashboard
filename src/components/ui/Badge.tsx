import React from 'react';
import { getStatusBadgeClass } from '../../utils/statusColors';

export const Badge = ({ children, status }: { children: React.ReactNode, status: string | undefined }) => (
  <span className={getStatusBadgeClass(status)}>
    {children}
  </span>
);
