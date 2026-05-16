import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { theme } from '../../../theme';

export default function GalleryFilterBar({
  searchQuery, setSearchQuery,
  sortBy, setSortBy,
  filterResolution, setFilterResolution,
  filterRating, setFilterRating,
  filterTags, setFilterTags,
  allTags
}) {
  return (
    <View style={styles.filterBar}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterControls}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.filterButtons}>
            {['date', 'title', 'duration', 'rating'].map(sort => {
              const icons = { date: '📅 Date', title: '🔤 Title', duration: '⏱️ Duration', rating: '★ Rating' };
              return (
                <TouchableOpacity
                  key={sort}
                  style={[styles.filterButton, sortBy === sort && styles.filterButtonActive]}
                  onPress={() => setSortBy(sort)}
                >
                  <Text style={[styles.filterButtonText, sortBy === sort && styles.filterButtonTextActive]}>
                    {icons[sort]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Quality:</Text>
          <View style={styles.filterButtons}>
            {['all', '1080', '720', '480'].map(res => (
              <TouchableOpacity
                key={res}
                style={[styles.filterButton, filterResolution === res && styles.filterButtonActive]}
                onPress={() => setFilterResolution(res)}
              >
                <Text style={[styles.filterButtonText, filterResolution === res && styles.filterButtonTextActive]}>
                  {res === 'all' ? 'All' : `${res}p`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Min Rating:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterRating === 0 && styles.filterButtonActive]}
              onPress={() => setFilterRating(0)}
            >
              <Text style={[styles.filterButtonText, filterRating === 0 && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.filterButton, filterRating === n && styles.filterButtonActive]}
                onPress={() => setFilterRating(n)}
              >
                <Text style={[styles.filterButtonText, filterRating === n && styles.filterButtonTextActive]}>
                  {'★'.repeat(n)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {allTags.length > 0 && (
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Tag:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, filterTags.length === 0 && styles.filterButtonActive]}
                onPress={() => setFilterTags([])}
              >
                <Text style={[styles.filterButtonText, filterTags.length === 0 && styles.filterButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {allTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.filterButton, filterTags.includes(tag) && styles.filterButtonActive]}
                  onPress={() => {
                    if (filterTags.includes(tag)) {
                      setFilterTags(filterTags.filter(t => t !== tag));
                    } else {
                      setFilterTags([...filterTags, tag]);
                    }
                  }}
                >
                  <Text style={[styles.filterButtonText, filterTags.includes(tag) && styles.filterButtonTextActive]}>
                    🏷️ {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: `${theme.colors.primary}30`,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    outlineStyle: 'none',
  },
  clearSearch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  clearSearchText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterControls: {
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
    maxWidth: 160,
  },
  filterButtonActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  filterButtonTextActive: {
    color: theme.colors.primary,
  },
});
