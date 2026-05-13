import React from 'react';
import DownloadTab from './tabs/DownloadTab';
import QueueTab from './tabs/QueueTab';
import GalleryTab from './tabs/GalleryTab';
import SettingsTab from './tabs/SettingsTab';
import BroadcastTab from './tabs/BroadcastTab';

export default function MainContent({ activeTab }) {
  const renderContent = () => {
    switch (activeTab) {
      case 'download':
        return <DownloadTab />;
      case 'queue':
        return <QueueTab />;
      case 'history':
        return <GalleryTab />;
      case 'broadcast':
        return <BroadcastTab />;
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
