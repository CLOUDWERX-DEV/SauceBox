import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { theme } from '../theme';
import { useStore } from '../store';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

// ---------------------------------------------------------------------------
// Filename parser
// ---------------------------------------------------------------------------
// SauceBox saves files as:  "Title [Uploader].ext"
// This function extracts title and uploader from that convention.
// It also handles:
//   - Legacy bare filenames:          "Some Title.mp4"
//   - yt-dlp ID suffixes:            "Title [abc123def456].mp4"  -> ID stripped
//   - URL-encoded spaces (+ signs):  "Some+Title.mp4"            -> spaces restored
//   - Underscored filenames:         "Some_Title.mp4"            -> spaces restored
// ---------------------------------------------------------------------------
function parseFilename(filePath) {
  const basename = filePath.split('/').pop();
  const dotIndex = basename.lastIndexOf('.');
  const ext      = dotIndex !== -1 ? basename.slice(dotIndex) : '';
  let name       = ext ? basename.slice(0, -ext.length) : basename;

  // Restore + signs and underscores used as space substitutes
  name = name.replace(/\+/g, ' ').replace(/_/g, ' ').trim();

  let title    = name;
  let uploader = '';

  // Match the trailing [...] bracket group
  const bracketRe = /\[([^\]]+)\]\s*$/;
  const match = name.match(bracketRe);
  if (match) {
    const bracketed = match[1].trim();
    // yt-dlp ID hashes are alphanumeric-only, no spaces, 8-32 chars
    const looksLikeId = /^[a-zA-Z0-9_-]{8,32}$/.test(bracketed) && !/\s/.test(bracketed);

    if (looksLikeId) {
      // Strip yt-dlp hash; no uploader info
      title    = name.slice(0, match.index).trim();
      uploader = '';
    } else {
      // It's an uploader/creator name
      title    = name.slice(0, match.index).trim();
      uploader = bracketed;
    }
  }

  title    = title.replace(/\s+/g, ' ').trim();
  uploader = uploader.replace(/\s+/g, ' ').trim();

  return { title: title || name, uploader };
}

export default function ImportModal({ visible, onClose }) {
  const [step, setStep] = useState('select');
  const [files, setFiles] = useState([]);
  const [strategy, setStrategy] = useState('');

  const [sharedUploader, setSharedUploader] = useState('');
  const [sharedTags, setSharedTags]         = useState('');
  const [sharedRating, setSharedRating]     = useState(0);

  const [currentIndex, setCurrentIndex]       = useState(0);
  const [individualData, setIndividualData]   = useState([]);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [processing, setProcessing]           = useState(false);

  const [conflicts, setConflicts]             = useState([]);
  const [conflictIndex, setConflictIndex]     = useState(0);
  const [pendingFiles, setPendingFiles]       = useState([]);
  const [replaceIds, setReplaceIds]           = useState([]);

  const importVideos = useStore(state => state.importVideos);
  const history = useStore(state => state.history);
  const removeFromHistory = useStore(state => state.removeFromHistory);

  const reset = () => {
    setStep('select');
    setFiles([]);
    setStrategy('');
    setSharedUploader('');
    setSharedTags('');
    setSharedRating(0);
    setCurrentIndex(0);
    setIndividualData([]);
    setProcessingIndex(0);
    setProcessing(false);
    setConflicts([]);
    setConflictIndex(0);
    setPendingFiles([]);
    setReplaceIds([]);
  };

  const handleClose = () => { reset(); onClose(); };

  if (!visible) return null;

  const processSelection = (result) => {
    if (!result || result.length === 0) return;

    const newConflicts = [];
    const newPending = [];
    
    result.forEach(file => {
      const existing = history.find(h => h.path === file || h.url === `file://${file}`);
      if (existing) {
        newConflicts.push({ file, existing });
      } else {
        newPending.push(file);
      }
    });

    if (newConflicts.length > 0) {
      setConflicts(newConflicts);
      setConflictIndex(0);
      setPendingFiles(newPending);
      setStep('conflicts');
    } else {
      setFiles(result);
      setStep('strategy');
    }
  };

  const nextConflictStep = (updatedPending, updatedReplaceIds) => {
    const nextIdx = conflictIndex + 1;
    if (nextIdx < conflicts.length) {
      setPendingFiles(updatedPending);
      setReplaceIds(updatedReplaceIds);
      setConflictIndex(nextIdx);
    } else {
      if (updatedPending.length > 0) {
        setFiles(updatedPending);
        setReplaceIds(updatedReplaceIds);
        setStep('strategy');
      } else {
        alert('No files left to import.');
        reset();
      }
    }
  };

  const resolveConflict = (action) => {
    let updatedPending = [...pendingFiles];
    let updatedReplaceIds = [...replaceIds];
    const current = conflicts[conflictIndex];

    if (action === 'replace') {
      updatedPending.push(current.file);
      updatedReplaceIds.push(current.existing.id);
    } else if (action === 'keep') {
      updatedPending.push(current.file);
    }

    nextConflictStep(updatedPending, updatedReplaceIds);
  };

  const resolveAllConflicts = (action) => {
    let updatedPending = [...pendingFiles];
    let updatedReplaceIds = [...replaceIds];

    for (let i = conflictIndex; i < conflicts.length; i++) {
      const current = conflicts[i];
      if (action === 'replace') {
        updatedPending.push(current.file);
        updatedReplaceIds.push(current.existing.id);
      } else if (action === 'keep') {
        updatedPending.push(current.file);
      }
    }

    if (updatedPending.length > 0) {
      setFiles(updatedPending);
      setReplaceIds(updatedReplaceIds);
      setStep('strategy');
    } else {
      alert('No files left to import.');
      reset();
    }
  };

  const handleSelectFiles = async () => {
    const result = await ipcRenderer?.invoke('select-import-files');
    if (result && result.length > 0) processSelection(result);
  };

  const handleSelectFolder = async () => {
    const result = await ipcRenderer?.invoke('select-import-folder');
    if (result && result.length > 0) {
      processSelection(result);
    } else if (result && result.length === 0) {
      alert('No supported video files found in that folder.');
    }
  };

  const handleStrategySelect = (strat) => {
    setStrategy(strat);
    if (strat === 'individual') {
      // Pre-fill title AND uploader from the filename using our smart parser
      setIndividualData(files.map(f => {
        const parsed = parseFilename(f);
        return { path: f, title: parsed.title, uploader: parsed.uploader, tags: '', rating: 0 };
      }));
      setStep('edit-individual');
    } else if (strat === 'same') {
      setStep('edit-same');
    } else {
      startImport('auto');
    }
  };

  const startImport = async (forcedStrategy) => {
    const usedStrategy = forcedStrategy || strategy;
    setStep('processing');
    setProcessing(true);
    const finalVideos = [];

    for (let i = 0; i < files.length; i++) {
      setProcessingIndex(i);
      const filePath = files[i];
      const parsed   = parseFilename(filePath);

      let meta      = { duration: null, resolution: null, filesize: null };
      let thumbnail = null;
      try {
        meta      = await ipcRenderer?.invoke('get-local-metadata', filePath);
        thumbnail = await ipcRenderer?.invoke('get-local-thumbnail', filePath);
      } catch (e) {
        console.error('Failed to get metadata/thumbnail:', e);
      }

      const videoObj = {
        url:        `file://${filePath}`,
        path:       filePath,
        title:      parsed.title,
        thumbnail,
        duration:   meta?.duration,
        resolution: meta?.resolution,
        filesize:   meta?.filesize || null,
        uploader:   parsed.uploader || 'Unknown',
        tags:       [],
        rating:     0,
        format:     filePath.split('.').pop(),
      };

      if (usedStrategy === 'same') {
        if (sharedUploader) videoObj.uploader = sharedUploader;
        videoObj.tags   = sharedTags.split(',').map(t => t.trim()).filter(Boolean);
        videoObj.rating = sharedRating;
      } else if (usedStrategy === 'individual') {
        const ind = individualData[i];
        videoObj.title    = (ind.title    || parsed.title).trim() || parsed.title;
        videoObj.uploader = (ind.uploader || parsed.uploader || 'Unknown').trim();
        videoObj.tags     = ind.tags.split(',').map(t => t.trim()).filter(Boolean);
        videoObj.rating   = ind.rating;
      }

      finalVideos.push(videoObj);
    }

    if (replaceIds.length > 0) {
      replaceIds.forEach(id => removeFromHistory(id));
    }
    importVideos(finalVideos);
    setProcessing(false);
    setStep('done');
  };

  const saveIndividualAndNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      startImport('individual');
    }
  };

  const updateIndividual = (field, val) => {
    const newData = [...individualData];
    newData[currentIndex][field] = val;
    setIndividualData(newData);
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>📥 Import Videos</Text>
            {!processing && (
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.content}>

            {/* ── Step: Select source ───────────────────────────── */}
            {step === 'select' && (
              <View style={styles.centerBox}>
                <Text style={styles.hintText}>Import local video files into your SauceBox Gallery.</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.bigActionBtn} onPress={handleSelectFiles}>
                    <Text style={styles.bigActionEmoji}>📄</Text>
                    <Text style={styles.bigActionTitle}>Select Files</Text>
                    <Text style={styles.bigActionSub}>Pick specific videos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bigActionBtn} onPress={handleSelectFolder}>
                    <Text style={styles.bigActionEmoji}>📁</Text>
                    <Text style={styles.bigActionTitle}>Select Folder</Text>
                    <Text style={styles.bigActionSub}>Scan entire directory</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Step: Conflicts ─────────────────────────────── */}
            {step === 'conflicts' && conflicts[conflictIndex] && (
              <View style={styles.centerBox}>
                <Text style={styles.bigActionEmoji}>⚠️</Text>
                <Text style={styles.stratBtnTitle}>Conflict Detected</Text>
                <Text style={styles.stratBtnSub}>
                  Video {conflictIndex + 1} of {conflicts.length} is already in your Gallery.
                </Text>

                <View style={styles.conflictCard}>
                  <Text style={styles.conflictCardTitle} numberOfLines={1}>{conflicts[conflictIndex].existing.title}</Text>
                  <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="middle">
                    {conflicts[conflictIndex].file}
                  </Text>
                </View>

                <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
                  <TouchableOpacity style={styles.stratBtn} onPress={() => resolveConflict('skip')}>
                    <Text style={styles.stratBtnTitle}>⏭️ Skip</Text>
                    <Text style={styles.stratBtnSub}>Do not import this video.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.stratBtn} onPress={() => resolveConflict('replace')}>
                    <Text style={styles.stratBtnTitle}>🔄 Replace Existing</Text>
                    <Text style={styles.stratBtnSub}>Overwrite the existing gallery entry with new metadata.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.stratBtn} onPress={() => resolveConflict('keep')}>
                    <Text style={styles.stratBtnTitle}>➕ Import as Duplicate</Text>
                    <Text style={styles.stratBtnSub}>Keep both entries in your gallery.</Text>
                  </TouchableOpacity>
                </View>

                {conflicts.length > 1 && (
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' }}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => resolveAllConflicts('skip')}>
                      <Text style={styles.secondaryBtnText}>Skip All Remaining</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => resolveAllConflicts('replace')}>
                      <Text style={styles.secondaryBtnText}>Replace All Remaining</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ── Step: Choose strategy ─────────────────────────── */}
            {step === 'strategy' && (
              <View style={styles.centerBox}>
                <Text style={styles.successText}>Found {files.length} video(s)!</Text>
                <Text style={styles.hintText}>
                  SauceBox filenames are automatically parsed for title &amp; creator.
                </Text>

                <TouchableOpacity style={styles.stratBtn} onPress={() => handleStrategySelect('auto')}>
                  <Text style={styles.stratBtnTitle}>🤖 Auto-Parse (Recommended)</Text>
                  <Text style={styles.stratBtnSub}>
                    Extracts title &amp; creator from filename. Best for SauceBox-downloaded files named{' '}
                    <Text style={styles.stratBtnCode}>"Title [Creator].mp4"</Text>.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.stratBtn} onPress={() => handleStrategySelect('same')}>
                  <Text style={styles.stratBtnTitle}>👯 Same Metadata for All</Text>
                  <Text style={styles.stratBtnSub}>
                    Override creator, rating &amp; tags for all {files.length} videos. Titles still auto-parsed.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.stratBtn} onPress={() => handleStrategySelect('individual')}>
                  <Text style={styles.stratBtnTitle}>✏️ Review Each Video</Text>
                  <Text style={styles.stratBtnSub}>
                    Confirm or edit each video's pre-filled title &amp; creator one by one.
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Step: Same metadata editor ───────────────────── */}
            {step === 'edit-same' && (
              <ScrollView style={styles.formView}>
                <Text style={styles.formHint}>
                  Titles are auto-parsed from filenames. Override creator, tags, and rating below.
                </Text>

                <Text style={styles.label}>Creator / Uploader Override</Text>
                <TextInput
                  style={styles.input}
                  value={sharedUploader}
                  onChangeText={setSharedUploader}
                  placeholder="Leave blank to use auto-parsed creator"
                  placeholderTextColor="#666"
                />

                <Text style={styles.label}>Tags (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={sharedTags}
                  onChangeText={setSharedTags}
                  placeholder="e.g. amateur, hd, solo"
                  placeholderTextColor="#666"
                />

                <Text style={styles.label}>Rating (0–5)</Text>
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setSharedRating(n)}>
                      <Text style={sharedRating >= n ? styles.starFilled : styles.starEmpty}>★</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setSharedRating(0)} style={{ marginLeft: 10 }}>
                    <Text style={{ color: '#999', fontSize: 12 }}>Clear</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={() => startImport('same')}>
                  <Text style={styles.primaryBtnText}>Start Import</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* ── Step: Individual editor ───────────────────────── */}
            {step === 'edit-individual' && individualData[currentIndex] && (
              <ScrollView style={styles.formView}>
                <Text style={styles.formHint}>
                  Video {currentIndex + 1} of {files.length} — pre-filled from filename
                </Text>
                <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="middle">
                  {individualData[currentIndex].path.split('/').pop()}
                </Text>

                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={individualData[currentIndex].title}
                  onChangeText={(val) => updateIndividual('title', val)}
                />

                <Text style={styles.label}>Creator / Uploader</Text>
                <TextInput
                  style={styles.input}
                  value={individualData[currentIndex].uploader}
                  placeholder="Auto-detected from filename"
                  placeholderTextColor="#666"
                  onChangeText={(val) => updateIndividual('uploader', val)}
                />

                <Text style={styles.label}>Tags (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={individualData[currentIndex].tags}
                  placeholder="e.g. amateur, hd"
                  placeholderTextColor="#666"
                  onChangeText={(val) => updateIndividual('tags', val)}
                />

                <Text style={styles.label}>Rating (0–5)</Text>
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => updateIndividual('rating', n)}>
                      <Text style={(individualData[currentIndex].rating || 0) >= n ? styles.starFilled : styles.starEmpty}>★</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => updateIndividual('rating', 0)} style={{ marginLeft: 10 }}>
                    <Text style={{ color: '#999', fontSize: 12 }}>Clear</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={saveIndividualAndNext}>
                  <Text style={styles.primaryBtnText}>
                    {currentIndex < files.length - 1 ? 'Next Video ➡️' : 'Finish & Import'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* ── Step: Processing ─────────────────────────────── */}
            {step === 'processing' && (
              <View style={styles.centerBox}>
                <Text style={styles.bigActionEmoji}>⏳</Text>
                <Text style={styles.stratBtnTitle}>Analyzing Videos...</Text>
                <Text style={styles.stratBtnSub}>Processing {processingIndex + 1} of {files.length}</Text>
                <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="middle">
                  {files[processingIndex]?.split('/').pop()}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(processingIndex / files.length) * 100}%` }]} />
                </View>
              </View>
            )}

            {/* ── Step: Done ───────────────────────────────────── */}
            {step === 'done' && (
              <View style={styles.centerBox}>
                <Text style={styles.bigActionEmoji}>✅</Text>
                <Text style={styles.stratBtnTitle}>Import Complete!</Text>
                <Text style={styles.stratBtnSub}>Successfully imported {files.length} video(s) into your Gallery.</Text>
                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleClose}>
                  <Text style={styles.primaryBtnText}>View Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modal:          { width: 520, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title:          { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  closeButton:    { padding: 4 },
  closeIcon:      { color: theme.colors.textSecondary, fontSize: 20 },
  content:        { padding: 24, minHeight: 300, justifyContent: 'center' },
  centerBox:      { alignItems: 'center', width: '100%' },
  row:            { flexDirection: 'row', gap: 16, marginTop: 24, width: '100%', justifyContent: 'center' },
  hintText:       { color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  successText:    { color: theme.colors.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  bigActionBtn:   { flex: 1, backgroundColor: theme.colors.surfaceLight, padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  bigActionEmoji: { fontSize: 40, marginBottom: 12 },
  bigActionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bigActionSub:   { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' },
  stratBtn:       { width: '100%', backgroundColor: theme.colors.surfaceLight, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  stratBtnTitle:  { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stratBtnSub:    { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  stratBtnCode:   { color: theme.colors.primary, fontWeight: '700' },
  formView:       { width: '100%' },
  formHint:       { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 12 },
  filePath:       { color: theme.colors.primary, fontSize: 11, opacity: 0.7, marginBottom: 16, textAlign: 'center', maxWidth: '100%' },
  label:          { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input:          { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, color: theme.colors.text, fontSize: 14, marginBottom: 16, outlineStyle: 'none' },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  starFilled:     { color: theme.colors.primary, fontSize: 28 },
  starEmpty:      { color: theme.colors.border, fontSize: 28 },
  primaryBtn:     { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  progressBar:    { width: '100%', height: 8, backgroundColor: theme.colors.surfaceLight, borderRadius: 4, marginTop: 24, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: theme.colors.primary },
  conflictCard:   { backgroundColor: theme.colors.surfaceLight, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, width: '100%', alignItems: 'center', marginTop: 12 },
  conflictCardTitle:{ color: theme.colors.primary, fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  secondaryBtn:   { flex: 1, backgroundColor: `${theme.colors.surfaceLight}`, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, cursor: 'pointer' },
  secondaryBtnText:{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
});
