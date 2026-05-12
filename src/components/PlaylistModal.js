import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, TextInput } from 'react-native';
import { theme } from '../theme';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };


export default function PlaylistModal({ visible, playlistInfo, onClose, onDownloadSelected }) {
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [thumbnails, setThumbnails] = useState({}); // {entryIndex: thumbnailUrl}
  const fetchingRef = useRef(false);

  const entries = playlistInfo?.entries || [];
  const title = playlistInfo?.title || '';
  const uploader = playlistInfo?.uploader || null;

  const filtered = useMemo(() =>
    entries.filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase())
    ),
    [entries, search]
  );

  // Lazily fetch thumbnails in background when modal opens
  useEffect(() => {
    if (!visible || entries.length === 0 || !ipcRenderer) return;
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setThumbnails({});

    const progressHandler = (_event, batchResults) => {
      setThumbnails(prev => {
        const next = { ...prev };
        batchResults.forEach(({ index, thumbnail }) => {
          if (thumbnail) next[index] = thumbnail;
        });
        return next;
      });
    };

    ipcRenderer.on('playlist-thumbnails-progress', progressHandler);

    ipcRenderer
      .invoke('get-entry-thumbnails', entries.map(e => ({ index: e.index, url: e.url })))
      .catch(err => console.error('Thumbnail fetch error:', err))
      .finally(() => {
        ipcRenderer.removeListener('playlist-thumbnails-progress', progressHandler);
        fetchingRef.current = false;
      });

    return () => {
      ipcRenderer.removeListener('playlist-thumbnails-progress', progressHandler);
    };
  }, [visible, playlistInfo]);

  if (!visible || !playlistInfo) return null;

  const toggleEntry = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map(e => e.index)));
  const selectNone = () => setSelected(new Set());
  const invertSelection = () => {
    setSelected(new Set(filtered.map(e => e.index).filter(i => !selected.has(i))));
  };

  const handleDownload = () => {
    const chosenEntries = entries.filter(e => selected.has(e.index));
    if (chosenEntries.length === 0) return;

    // Merge lazily-fetched thumbnails into the entries before handing off
    const enrichedEntries = chosenEntries.map(e => ({
      ...e,
      thumbnail: thumbnails[e.index] || e.thumbnail || null,
    }));

    onDownloadSelected(enrichedEntries);
    setSelected(new Set());
    setSearch('');
    onClose();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selected.has(e.index));

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.playlistIcon}>🎬</Text>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.subtitle}>
                  {uploader ? `${uploader}  •  ` : ''}{entries.length} video{entries.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Filter videos..."
                placeholderTextColor="#555"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearch}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.selectionButtons}>
              <TouchableOpacity
                style={[styles.selBtn, allFilteredSelected && styles.selBtnActive]}
                onPress={allFilteredSelected ? selectNone : selectAll}
              >
                <Text style={[styles.selBtnText, allFilteredSelected && styles.selBtnTextActive]}>
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selBtn} onPress={invertSelection}>
                <Text style={styles.selBtnText}>Invert</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selection count bar */}
          {selected.size > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionBarText}>
                ✓ {selected.size} of {entries.length} selected
              </Text>
            </View>
          )}

          {/* Video List */}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {filtered.length === 0 ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No videos match "{search}"</Text>
              </View>
            ) : (
              filtered.map((entry) => {
                const isSelected = selected.has(entry.index);
                return (
                  <TouchableOpacity
                    key={entry.id || entry.index}
                    style={[styles.entryRow, isSelected && styles.entryRowSelected]}
                    onPress={() => toggleEntry(entry.index)}
                    activeOpacity={0.7}
                  >
                    {/* Checkbox */}
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>

                    {/* Thumbnail */}
                    <View style={styles.thumbContainer}>
                      {thumbnails[entry.index] ? (
                        <Image source={{ uri: thumbnails[entry.index] }} style={styles.thumb} />
                      ) : entry.thumbnail ? (
                        <Image source={{ uri: entry.thumbnail }} style={styles.thumb} />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <Text style={styles.thumbPlaceholderText}>⏳</Text>
                        </View>
                      )}
                      {entry.duration && (
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{formatDuration(entry.duration)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryTitle} numberOfLines={2}>{entry.title}</Text>
                      {entry.uploader && (
                        <Text style={styles.entryUploader} numberOfLines={1}>{entry.uploader}</Text>
                      )}
                    </View>

                    {/* Index */}
                    <Text style={styles.entryIndex}>#{entry.index + 1}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.downloadButton, selected.size === 0 && styles.downloadButtonDisabled]}
              onPress={handleDownload}
              disabled={selected.size === 0}
            >
              <Text style={styles.downloadButtonText}>
                {selected.size === 0
                  ? '🚀 Select Videos to Download'
                  : `🚀 Download ${selected.size} Video${selected.size !== 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modal: {
    width: '100%',
    maxWidth: 860,
    maxHeight: '90vh',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexShrink: 0,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 16,
  },
  playlistIcon: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  closeButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexShrink: 0,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    outlineStyle: 'none',
  },
  clearSearch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  clearSearchText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  selBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
  },
  selBtnActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  selBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  selBtnTextActive: {
    color: theme.colors.primary,
  },

  // Selection bar
  selectionBar: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}30`,
    flexShrink: 0,
  },
  selectionBarText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    gap: 4,
  },
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  // Entry row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  entryRowSelected: {
    backgroundColor: `${theme.colors.primary}12`,
    borderColor: `${theme.colors.primary}40`,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  thumbContainer: {
    position: 'relative',
    width: 112,
    height: 63,
    flexShrink: 0,
    borderRadius: 6,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 22,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 3,
  },
  entryUploader: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  entryIndex: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
    flexShrink: 0,
    minWidth: 30,
    textAlign: 'right',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexShrink: 0,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  downloadButton: {
    flex: 3,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer',
  },
  downloadButtonDisabled: {
    opacity: 0.45,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
