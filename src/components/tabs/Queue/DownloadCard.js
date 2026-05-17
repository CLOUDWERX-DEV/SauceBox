import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import VideoThumbnail from '../../VideoThumbnail';
import { theme } from '../../../theme';
import { queueStyles as styles } from './QueueStyles';
import Tooltip from '../../Tooltip';

export default function DownloadCard({
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
                <Tooltip content="Open Folder">
                  <TouchableOpacity 
                    style={styles.folderButton}
                    onPress={() => handleOpenFolder(download)}
                  >
                    <Text style={styles.folderButtonText}>📁</Text>
                  </TouchableOpacity>
                </Tooltip>
              )}
              <Tooltip content="Remove">
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeDownload(download.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </Tooltip>
            </View>
          </View>
          <Text style={styles.downloadMeta}>
            {formatDuration(download.duration)}
            {download.resolution && ` • ${formatResolutionBadge(download.resolution)}`}
            {download.filesize && ` • ${formatFileSize(download.filesize)}`}
          </Text>
          
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
