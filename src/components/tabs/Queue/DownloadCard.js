import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import VideoThumbnail from '../../VideoThumbnail';
import { theme } from '../../../theme';
import { queueStyles as styles } from './QueueStyles';
import Tooltip from '../../Tooltip';

const formatDate = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function DownloadCard({
  index = 0,
  download,
  handlePlayVideo,
  handleOpenFolder,
  handleStartDownload,
  handlePauseDownload,
  handleRetryDownload,
  removeDownload,
  formatResolutionBadge,
  formatDuration,
  formatFileSize,
  getStatusIcon,
  getStatusColor
}) {
  return (
    <View 
      style={[
        styles.downloadCard,
        download.status === 'completed' && styles.downloadCardCompleted
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.thumbnailContainer}>
          <VideoThumbnail
            uri={download.thumbnail}
            style={styles.thumbnail}
          />
          {download.status === 'completed' && (
            <View style={styles.playOverlay}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => handlePlayVideo(download)}
              >
                <Text style={styles.playIcon}>▶</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.downloadInfo}>
          <View style={styles.downloadHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              {(() => {
                try {
                  const urlObj = new URL(download.url);
                  let domain = urlObj.hostname.replace('www.', '');
                  domain = domain.substring(0, domain.lastIndexOf('.'));
                  if (domain) {
                    const formattedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
                    return (
                      <View style={styles.providerBadge}>
                        <Text style={styles.providerBadgeText}>{formattedDomain}</Text>
                      </View>
                    );
                  }
                } catch (e) {}
                return null;
              })()}
              <Text style={styles.downloadTitle} numberOfLines={2}>
                {download.title}
              </Text>
              {download.uploader && download.uploader !== 'Unknown' && (
                <Text style={styles.uploaderName}>
                  👤 {download.uploader}
                </Text>
              )}
            </View>
            <View style={styles.headerButtons}>
              {download.status === 'completed' && (
                <Tooltip content="Open Folder" position={index === 0 ? "bottom" : "top"}>
                  <TouchableOpacity 
                    style={styles.folderButton}
                    onPress={() => handleOpenFolder(download)}
                  >
                    <Text style={styles.folderButtonText}>📁</Text>
                  </TouchableOpacity>
                </Tooltip>
              )}
              <Tooltip content="Remove" position={index === 0 ? "bottom" : "top"}>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeDownload(download.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </Tooltip>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 12, flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
            {/* Duration Badge */}
            <Tooltip content="Duration" position={index === 0 ? "bottom" : "top"}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeIcon}>⏱️</Text>
                <Text style={styles.metaBadgeText}>
                  {formatDuration(download.duration)}
                </Text>
              </View>
            </Tooltip>

            {/* Resolution Badge */}
            {download.resolution && (
              <Tooltip content="Resolution" position={index === 0 ? "bottom" : "top"}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeIcon}>📺</Text>
                  <Text style={styles.metaBadgeText}>
                    {formatResolutionBadge(download.resolution)}
                  </Text>
                </View>
              </Tooltip>
            )}

            {/* File Size Badge */}
            {download.filesize && (
              <Tooltip content="File Size" position={index === 0 ? "bottom" : "top"}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeIcon}>💾</Text>
                  <Text style={styles.metaBadgeText}>
                    {formatFileSize(download.filesize)}
                  </Text>
                </View>
              </Tooltip>
            )}

            {/* Age Badge - use download.id which is Date.now() at queue time */}
            {download.id && formatDate(download.id) && (
              <Tooltip content="Queued" position={index === 0 ? "bottom" : "top"}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeIcon}>🕒</Text>
                  <Text style={styles.metaBadgeText}>
                    {formatDate(download.id)}
                  </Text>
                </View>
              </Tooltip>
            )}
          </View>
          
          <View style={styles.progressSection}>
            {download.status !== 'completed' && (
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${download.progress}%`,
                      backgroundColor: getStatusColor(download.status)
                    }
                  ]} 
                />
              </View>
            )}
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: getStatusColor(download.status) }]}>
                {getStatusIcon(download.status)} {download.status}
              </Text>
              {download.status === 'failed' && download.error && (
                <Text style={{ fontSize: 11, color: theme.colors.error, opacity: 0.8, marginTop: 3, fontStyle: 'italic' }}>
                  {download.error}
                </Text>
              )}
              {download.status === 'downloading' && download.speed && (
                <View style={styles.statsContainer}>
                  <Text style={styles.speedText}>⚡ {download.speed}</Text>
                  {download.eta && (
                    <Text style={styles.etaText}>⏱️ {download.eta}</Text>
                  )}
                  <Text style={styles.progressText}>
                    {Math.round(download.progress)}%
                  </Text>
                </View>
              )}
              {download.status === 'downloading' && (
                <TouchableOpacity 
                  style={styles.pauseButton}
                  onPress={() => handlePauseDownload(download)}
                >
                  <Text style={styles.pauseButtonText}>⏸️ Pause</Text>
                </TouchableOpacity>
              )}
              {(download.status === 'pending' || download.status === 'paused') && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleStartDownload(download)}
                >
                  <Text style={styles.actionButtonText}>▶ {download.status === 'paused' ? 'Resume' : 'Start'}</Text>
                </TouchableOpacity>
              )}
              {download.status === 'failed' && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => handleRetryDownload(download)}
                >
                  <Text style={styles.retryButtonText}>🔄 Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
