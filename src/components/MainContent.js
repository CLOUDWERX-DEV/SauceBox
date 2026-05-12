import React from 'react';
import DownloadTab from './tabs/DownloadTab';
import QueueTab from './tabs/QueueTab';
import HistoryTab from './tabs/HistoryTab';
import SettingsTab from './tabs/SettingsTab';

export default function MainContent({ activeTab }) {
  const renderContent = () => {
    switch (activeTab) {
      case 'download':
        return <DownloadTab />;
      case 'queue':
        return <QueueTab />;
      case 'history':
        return <HistoryTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DownloadTab />;
    }
  };

  return (
    <div className="main-content-wrapper">
      {renderContent()}
    </div>
  );
}
