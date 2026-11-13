import React from 'react';
import { DashboardModal } from './DashboardModal';

interface NewDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDashboardModal: React.FC<NewDashboardModalProps> = ({ isOpen, onClose }) => {
  return <DashboardModal isOpen={isOpen} onClose={onClose} />;
};
