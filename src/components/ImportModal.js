import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { theme } from '../theme';
import { useStore } from '../store';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function ImportModal({ visible, onClose }) {
  const [step, setStep] = useState('select'); // select -> filesFound -> strategy -> (edit if needed) -> processing -> done
  const [files, setFiles] = useState([]);
  const [strategy, setStrategy] = useState(''); // 'auto', 'same', 'individual'
  
  // Shared metadata for 'same'
  const [sharedUploader, setSharedUploader] = useState('');
  const [sharedTags, setSharedTags] = useState('');
  const [sharedRating, setSharedRating] = useState(0);

  // Individual editing
  const [currentIndex, setCurrentIndex] = useState(0);
  const [individualData, setIndividualData] = useState([]);

  const [processingIndex, setProcessingIndex] = useState(0);
  const [processing, setProcessing] = useState(false);

  const importVideos = useStore(state => state.importVideos);

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
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!visible) return null;

  const handleSelectFiles = async () => {
    const result = await ipcRenderer?.invoke('select-import-files');
    if (result && result.length > 0) {
      setFiles(result);
      setStep('strategy');
    }
  };

  const handleSelectFolder = async () => {
    const result = await ipcRenderer?.invoke('select-import-folder');
    if (result && result.length > 0) {
      setFiles(result);
      setStep('strategy');
    } else if (result && result.length === 0) {
      alert('No supported video files found in that folder.');
    }
  };

  const handleStrategySelect = (strat) => {
    setStrategy(strat);
    if (strat === 'individual') {
      setIndividualData(files.map(f => ({
        path: f,
        title: f.split('/').pop().replace(/\.[^/.]+$/, ""), // filename without ext
        uploader: '',
        tags: '',
        rating: 0
      })));
      setStep('edit-individual');
    } else if (strat === 'same') {
      setStep('edit-same');
    } else {
      startImport(); // Auto
    }
  };

  const startImport = async () => {
    setStep('processing');
    setProcessing(true);
    const finalVideos = [];

    for (let i = 0; i < files.length; i++) {
      setProcessingIndex(i);
      const filePath = files[i];
      const filename = filePath.split('/').pop().replace(/\.[^/.]+$/, "");
      
      let meta = { duration: null, resolution: null };
      let thumbnail = null;
      try {
        meta = await ipcRenderer?.invoke('get-local-metadata', filePath);
        thumbnail = await ipcRenderer?.invoke('get-local-thumbnail', filePath);
      } catch (e) {
        console.error('Failed to get metadata/thumbnail:', e);
      }

      let videoObj = {
        url: `file://${filePath}`, // local files get file:// prefix or just store path
        path: filePath,
        title: filename,
        thumbnail: thumbnail,
        duration: meta?.duration,
        resolution: meta?.resolution,
        filesize: meta?.filesize || null,
        uploader: 'Unknown',
        tags: [],
        rating: 0,
        format: filePath.split('.').pop()
      };

      if (strategy === 'same') {
        videoObj.uploader = sharedUploader || 'Unknown';
        videoObj.tags = sharedTags.split(',').map(t => t.trim()).filter(Boolean);
        videoObj.rating = sharedRating;
      } else if (strategy === 'individual') {
        const ind = individualData[i];
        videoObj.title = ind.title || filename;
        videoObj.uploader = ind.uploader || 'Unknown';
        videoObj.tags = ind.tags.split(',').map(t => t.trim()).filter(Boolean);
        videoObj.rating = ind.rating;
      }

      finalVideos.push(videoObj);
    }

    importVideos(finalVideos);
    setProcessing(false);
    setStep('done');
  };

  const saveIndividualAndNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      startImport();
    }
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
            {step === 'select' && (
              <View style={styles.centerBox}>
                <Text style={styles.hintText}>Import local video files into your LocalFap Gallery.</Text>
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

            {step === 'strategy' && (
              <View style={styles.centerBox}>
                <Text style={styles.successText}>Found {files.length} video(s)!</Text>
                <Text style={styles.hintText}>How would you like to set the metadata (Creator, Tags, etc)?</Text>
                
                <TouchableOpacity style={styles.stratBtn} onPress={() => handleStrategySelect('auto')}>
                  <Text style={styles.stratBtnTitle}>🤖 Auto-detect Only</Text>
                  <Text style={styles.stratBtnSub}>Just use filenames for titles and auto-detect resolution/playtime.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.stratBtn} onPress={() => handleStrategySelect('same')}>
                  <Text style={styles.stratBtnTitle}>👯 Same Metadata for All</Text>
                  <Text style={styles.stratBtnSub}>Apply the same Creator, Rating, and Tags to all {files.length} videos.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.stratBtn} onPress={() => handleStrategySelect('individual')}>
                  <Text style={styles.stratBtnTitle}>✏️ Edit Individually</Text>
                  <Text style={styles.stratBtnSub}>Go through each video one by one to set custom metadata.</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'edit-same' && (
              <ScrollView style={styles.formView}>
                <Text style={styles.formHint}>These settings will apply to all {files.length} imported videos.</Text>
                
                <Text style={styles.label}>Creator / Uploader</Text>
                <TextInput style={styles.input} value={sharedUploader} onChangeText={setSharedUploader} placeholder="e.g. MyStudio" placeholderTextColor="#666" />

                <Text style={styles.label}>Tags (comma separated)</Text>
                <TextInput style={styles.input} value={sharedTags} onChangeText={setSharedTags} placeholder="e.g. amateur, hd, solo" placeholderTextColor="#666" />

                <Text style={styles.label}>Rating (0-5)</Text>
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setSharedRating(n)}>
                      <Text style={sharedRating >= n ? styles.starFilled : styles.starEmpty}>★</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setSharedRating(0)} style={{marginLeft: 10}}>
                    <Text style={{color: '#999', fontSize: 12}}>Clear</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={startImport}>
                  <Text style={styles.primaryBtnText}>Start Import</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {step === 'edit-individual' && (
              <ScrollView style={styles.formView}>
                <Text style={styles.formHint}>Video {currentIndex + 1} of {files.length}</Text>
                <Text style={{color: theme.colors.primary, marginBottom: 16, fontSize: 12}}>{individualData[currentIndex]?.path}</Text>

                <Text style={styles.label}>Title</Text>
                <TextInput style={styles.input} 
                  value={individualData[currentIndex]?.title} 
                  onChangeText={(val) => {
                    const newData = [...individualData];
                    newData[currentIndex].title = val;
                    setIndividualData(newData);
                  }} 
                />

                <Text style={styles.label}>Creator / Uploader</Text>
                <TextInput style={styles.input} 
                  value={individualData[currentIndex]?.uploader} 
                  onChangeText={(val) => {
                    const newData = [...individualData];
                    newData[currentIndex].uploader = val;
                    setIndividualData(newData);
                  }} 
                />

                <Text style={styles.label}>Tags (comma separated)</Text>
                <TextInput style={styles.input} 
                  value={individualData[currentIndex]?.tags} 
                  onChangeText={(val) => {
                    const newData = [...individualData];
                    newData[currentIndex].tags = val;
                    setIndividualData(newData);
                  }} 
                />

                <Text style={styles.label}>Rating (0-5)</Text>
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => {
                      const newData = [...individualData];
                      newData[currentIndex].rating = n;
                      setIndividualData(newData);
                    }}>
                      <Text style={(individualData[currentIndex]?.rating || 0) >= n ? styles.starFilled : styles.starEmpty}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={saveIndividualAndNext}>
                  <Text style={styles.primaryBtnText}>{currentIndex < files.length - 1 ? 'Next Video ➡️' : 'Finish & Import'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {step === 'processing' && (
              <View style={styles.centerBox}>
                <Text style={styles.bigActionEmoji}>⏳</Text>
                <Text style={styles.stratBtnTitle}>Analyzing Videos...</Text>
                <Text style={styles.stratBtnSub}>Processing {processingIndex + 1} of {files.length}</Text>
                <Text style={{color: theme.colors.textSecondary, marginTop: 12, fontSize: 11}}>{files[processingIndex]}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${((processingIndex) / files.length) * 100}%` }]} />
                </View>
              </View>
            )}

            {step === 'done' && (
              <View style={styles.centerBox}>
                <Text style={styles.bigActionEmoji}>✅</Text>
                <Text style={styles.stratBtnTitle}>Import Complete!</Text>
                <Text style={styles.stratBtnSub}>Successfully imported {files.length} video(s) into your Gallery.</Text>
                <TouchableOpacity style={[styles.primaryBtn, {marginTop: 24}]} onPress={handleClose}>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: 500, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  closeButton: { padding: 4 },
  closeIcon: { color: theme.colors.textSecondary, fontSize: 20 },
  content: { padding: 24, minHeight: 300, justifyContent: 'center' },
  centerBox: { alignItems: 'center' },
  row: { flexDirection: 'row', gap: 16, marginTop: 24, width: '100%', justifyContent: 'center' },
  hintText: { color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  successText: { color: theme.colors.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  bigActionBtn: { flex: 1, backgroundColor: theme.colors.surfaceLight, padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  bigActionEmoji: { fontSize: 40, marginBottom: 12 },
  bigActionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bigActionSub: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' },
  stratBtn: { width: '100%', backgroundColor: theme.colors.surfaceLight, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  stratBtnTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stratBtnSub: { color: theme.colors.textSecondary, fontSize: 13 },
  formView: { width: '100%' },
  formHint: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 },
  label: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, color: theme.colors.text, fontSize: 14, marginBottom: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  starFilled: { color: theme.colors.primary, fontSize: 28 },
  starEmpty: { color: theme.colors.border, fontSize: 28 },
  primaryBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  progressBar: { width: '100%', height: 8, backgroundColor: theme.colors.surfaceLight, borderRadius: 4, marginTop: 24, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary }
});
