import { StyleSheet } from 'react-native';
import { theme } from '../../theme';

export const helpStyles = StyleSheet.create({
  contentTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: theme.colors.surfaceLight,
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  paragraph: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
  },
  highlight: {
    color: '#fff',
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: theme.colors.primary,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bulletList: {
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
    paddingLeft: 12,
  },
  bulletItem: {
    fontSize: 15,
    color: '#bbb',
    lineHeight: 24,
  }
});
