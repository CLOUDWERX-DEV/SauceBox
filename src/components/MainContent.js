import React from 'react';
import DownloadTab from './tabs/DownloadTab';
import QueueTab from './tabs/QueueTab';
import GalleryTab from './tabs/GalleryTab';
import PlaylistsTab from './tabs/PlaylistsTab';
import SettingsTab from './tabs/SettingsTab';
import BroadcastTab from './tabs/BroadcastTab';

export default function MainContent({ activeTab, onNavigate }) {
  const renderContent = () => {
    switch (activeTab) {
      case 'download':
        return <DownloadTab onNavigate={onNavigate} />;
      case 'queue':
        return <QueueTab onNavigate={onNavigate} />;
      case 'history':
        return <GalleryTab onNavigate={onNavigate} />;
      case 'playlists':
        return <PlaylistsTab />;
      case 'broadcast':
        return <BroadcastTab />;
      case 'settings':
        return <SettingsTab onNavigate={onNavigate} />;
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
