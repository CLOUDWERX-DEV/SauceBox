import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '../../store';
import BatchDownloadModal from '../BatchDownloadModal';
import VideoPreviewModal from '../VideoPreviewModal';
import PlaylistModal from '../PlaylistModal';

import { downloadStyles as styles } from './Download/DownloadStyles';
import DownloadInputForm from './Download/DownloadInputForm';
import BatchSection from './Download/BatchSection';
import HowToUseCard from './Download/HowToUseCard';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function DownloadTab({ onNavigate }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewInfo, setPreviewInfo] = useState(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState(null);

  const addDownload = useStore(state => state.addDownload);
  const settings = useStore(state => state.settings);

  // Unified URL resolver — detects playlist vs single video
  const resolveUrl = async (targetUrl) => {
    setLoading(true);
    setLoadingMsg('🔍 Fetching info...');
    try {
      const info = await ipcRenderer?.invoke('get-playlist-info', targetUrl);
      return info;
    } finally {
      setLoadingMsg('');
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setLoadingMsg('🔍 Fetching info...');
    try {
      const info = await ipcRenderer?.invoke('get-playlist-info', url.trim());

      if (info.isPlaylist && info.entries.length > 1) {
        setPlaylistInfo({ ...info, url: url.trim() });
        setPlaylistModalVisible(true);
      } else {
        let videoData;
        try {
          videoData = await ipcRenderer?.invoke('get-video-info', url.trim());
        } catch (e) {
          videoData = info.singleVideo;
        }
        if (!videoData) videoData = info.singleVideo;
        setPreviewInfo({ ...videoData, url: url.trim() });
        setPreviewModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to get info:', error);
      alert('Failed to load info: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleDownloadFromPreview = (quality = 'best') => {
    setPreviewModalVisible(false);
    const info = previewInfo;
    const qualityHeight = quality !== 'best' ? String(quality).replace(/p$/i, '') : null;

    const bestAvailHeight = Array.isArray(info?.availableQualities) && info.availableQualities.length > 0
      ? info.availableQualities[0]
      : null;
    const resolutionHint = qualityHeight
      ? `${qualityHeight}p`
      : (bestAvailHeight ? `${bestAvailHeight}p` : null);

    const download = {
      url: info.url,
      title: info.title || 'Unknown Title',
      thumbnail: info.thumbnail,
      duration: info.duration,
      uploader: info.uploader,
      resolution: resolutionHint,
      format: info.format,
      filesize: info.filesize,
      quality: qualityHeight || 'best',
    };
    addDownload(download);
    setUrl('');
  };

  const queueDownload = async (urlToDownload) => {
    setLoading(true);
    try {
      const existingDownload = useStore.getState().history.find(h => h.url === urlToDownload);
      if (existingDownload) {
        const confirmDownload = window.confirm(
          `You already downloaded this video on ${new Date(existingDownload.timestamp).toLocaleDateString()}!\n\n` +
          `Title: ${existingDownload.title}\n\nDo you want to download it again?`
        );
        if (!confirmDownload) return;
      }

      const info = await ipcRenderer?.invoke('get-video-info', urlToDownload);

      const settingsQualityHeight = settings.quality !== 'best'
        ? String(settings.quality).replace(/p$/i, '')
        : null;

      const bestAvailHeight = Array.isArray(info?.availableQualities) && info.availableQualities.length > 0
        ? info.availableQualities[0]
        : null;

      const resolutionHint = settingsQualityHeight
        ? `${settingsQualityHeight}p`
        : (bestAvailHeight ? `${bestAvailHeight}p` : null);

      const download = {
        url: urlToDownload,
        title: info?.title || 'Unknown Title',
        thumbnail: info?.thumbnail,
        duration: info?.duration,
        uploader: info?.uploader,
        resolution: resolutionHint,
        format: info?.format,
        filesize: info?.filesize,
        quality: settingsQualityHeight || 'best',
      };

      addDownload(download);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setLoadingMsg('🔍 Detecting URL type...');
    try {
      const info = await ipcRenderer?.invoke('get-playlist-info', url.trim());

      if (info.isPlaylist && info.entries.length > 1) {
        setPlaylistInfo({ ...info, url: url.trim() });
        setPlaylistModalVisible(true);
        setLoading(false);
        setLoadingMsg('');
        return;
      }

      const existingDownload = useStore.getState().history.find(h => h.url === url.trim());
      if (existingDownload) {
        const confirmDownload = window.confirm(
          `You already downloaded this video on ${new Date(existingDownload.timestamp).toLocaleDateString()}!\n\n` +
          `Title: ${existingDownload.title}\n\nDo you want to download it again?`
        );
        if (!confirmDownload) return;
      }

      setLoadingMsg('📡 Fetching video info...');
      const videoData = await ipcRenderer?.invoke('get-video-info', url.trim());

      const settingsQualityHeight = settings.quality !== 'best'
        ? String(settings.quality).replace(/p$/i, '')
        : null;

      const bestAvailHeight = Array.isArray(videoData?.availableQualities) && videoData.availableQualities.length > 0
        ? videoData.availableQualities[0]
        : null;

      const resolutionHint = settingsQualityHeight
        ? `${settingsQualityHeight}p`
        : (bestAvailHeight ? `${bestAvailHeight}p` : null);

      const download = {
        url: url.trim(),
        title: videoData?.title || 'Unknown Title',
        thumbnail: videoData?.thumbnail,
        duration: videoData?.duration,
        uploader: videoData?.uploader,
        resolution: resolutionHint,
        format: videoData?.format,
        filesize: videoData?.filesize,
        quality: settingsQualityHeight || 'best'
      };

      addDownload(download);

      setUrl('');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleDownloadFromPlaylist = async (selectedEntries) => {
    setPlaylistModalVisible(false);
    setUrl('');

    const settingsQualityHeight = settings.quality !== 'best'
      ? String(settings.quality).replace(/p$/i, '')
      : null;

    for (const entry of selectedEntries) {
      try {
        const resolutionHint = settingsQualityHeight
          ? `${settingsQualityHeight}p`
          : null;

        const download = {
          url: entry.url,
          title: entry.title || 'Unknown Title',
          thumbnail: entry.thumbnail || null,
          duration: entry.duration || null,
          uploader: entry.uploader || null,
          resolution: resolutionHint,
          format: null,
          filesize: null,
          quality: settingsQualityHeight || 'best',
        };

        addDownload(download);
      } catch (error) {
        console.error(`Failed to queue ${entry.title}:`, error);
      }
    }
  };

  const handleBatchDownload = async (urls) => {
    for (const batchUrl of urls) {
      try {
        const info = await ipcRenderer?.invoke('get-video-info', batchUrl);

        const settingsQualityHeight = settings.quality !== 'best'
          ? String(settings.quality).replace(/p$/i, '')
          : null;

        const bestAvailHeight = Array.isArray(info?.availableQualities) && info.availableQualities.length > 0
          ? info.availableQualities[0]
          : null;

        const resolutionHint = settingsQualityHeight
          ? `${settingsQualityHeight}p`
          : (bestAvailHeight ? `${bestAvailHeight}p` : null);

        const download = {
          url: batchUrl,
          title: info?.title || 'Unknown Title',
          thumbnail: info?.thumbnail,
          duration: info?.duration,
          uploader: info?.uploader,
          resolution: resolutionHint,
          format: info?.format,
          filesize: info?.filesize,
          quality: settingsQualityHeight || 'best'
        };

        addDownload(download);
      } catch (error) {
        console.error('Failed to add batch download:', error);
      }
    }
  };

  return (
    <>
      <div style={styles.content}>
        <View style={styles.card}>
          <DownloadInputForm 
            url={url} 
            setUrl={setUrl} 
            loading={loading} 
            loadingMsg={loadingMsg} 
            handlePreview={handlePreview} 
            handleDownload={handleDownload} 
          />
          <BatchSection onOpenBatchMode={() => setBatchModalVisible(true)} />
          <View style={styles.divider} />
        </View>

        <View style={styles.bottomCardsContainer}>
          <HowToUseCard onNavigate={onNavigate} />
        </View>
      </div>

      <BatchDownloadModal
        visible={batchModalVisible}
        onClose={() => setBatchModalVisible(false)}
        onSubmit={handleBatchDownload}
      />

      <VideoPreviewModal
        visible={previewModalVisible}
        videoInfo={previewInfo}
        defaultQuality={String(settings.quality || 'best').replace(/p$/i, '')}
        onClose={() => setPreviewModalVisible(false)}
        onDownload={handleDownloadFromPreview}
      />

      <PlaylistModal
        visible={playlistModalVisible}
        playlistInfo={playlistInfo}
        onClose={() => setPlaylistModalVisible(false)}
        onDownloadSelected={handleDownloadFromPlaylist}
      />
    </>
  );
}
