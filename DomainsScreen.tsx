import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { DomainsService } from '../../services/domains';
import { Card, Button, Loading, ErrorMessage } from '../../components/UI';
import { theme } from '../../config/theme';
import { DomainExtension, DomainSearchResult, KenicRegistrar } from '../../types';

export default function DomainsScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExtension, setSelectedExtension] = useState<DomainExtension>('.me.ke');
  const [searchResult, setSearchResult] = useState<DomainSearchResult | null>(null);
  const [registrars, setRegistrars] = useState<KenicRegistrar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrars, setShowRegistrars] = useState(false);
  const [registrarPage, setRegistrarPage] = useState(1);

  const extensions = DomainsService.getDomainExtensions();

  const handleSearch = async () => {
    const validation = DomainsService.validateDomainName(searchTerm);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid domain name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await DomainsService.searchDomain(searchTerm.toLowerCase().trim(), selectedExtension);
      
      if (result.success) {
        setSearchResult(result.data!);
        if (result.data!.available) {
          // Show all registrars when domain is available
          const { registrars: allRegistrars } = DomainsService.getRegistrarsPaginated(1, 20);
          setRegistrars(allRegistrars);
          setShowRegistrars(true);
          setRegistrarPage(1);
        } else {
          setShowRegistrars(false);
        }
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRegistrars = () => {
    const nextPage = registrarPage + 1;
    const { registrars: moreRegistrars, hasMore } = DomainsService.getRegistrarsPaginated(nextPage, 10);
    
    if (hasMore) {
      setRegistrars(prev => [...prev, ...moreRegistrars]);
      setRegistrarPage(nextPage);
    }
  };

  const handleRegister = (registrar: KenicRegistrar) => {
    const url = DomainsService.formatRegistrarUrl(registrar.email);
    Linking.openURL(url).catch(() => {
      // Fallback to email
      Linking.openURL(`mailto:${registrar.email}?subject=Domain Registration Request&body=I would like to register ${searchTerm}${selectedExtension}`);
    });
  };

  const renderRegistrarItem = ({ item }: { item: KenicRegistrar }) => (
    <Card style={styles.registrarCard}>
      <View style={styles.registrarContent}>
        <Text style={styles.registrarName}>{item.name}</Text>
        <Text style={styles.registrarContact}>{item.phone}</Text>
        <Text style={styles.registrarEmail}>{item.email}</Text>
        <Button
          title="Register Domain"
          onPress={() => handleRegister(item)}
          size="small"
          style={styles.registerButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Perfect Domain</Text>
        <Text style={styles.subtitle}>
          Register a .ke domain for your portfolio or business
        </Text>
        <View style={styles.portfolioMessage}>
          <Text style={styles.portfolioText}>
            💡 Build your online presence! Register a domain to showcase your coding progress and publish your portfolio to enhance your visibility in the tech space.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Form */}
        <Card style={styles.searchCard}>
          <Text style={styles.searchLabel}>Domain Name</Text>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Enter your desired domain name"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.searchLabel}>Extension</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedExtension}
              onValueChange={setSelectedExtension}
              style={styles.picker}
            >
              {extensions.map((ext) => (
                <Picker.Item
                  key={ext.extension}
                  label={`${ext.extension} - ${ext.description}`}
                  value={ext.extension}
                />
              ))}
            </Picker>
          </View>

          <Button
            title="Search Domain"
            onPress={handleSearch}
            loading={loading}
            disabled={!searchTerm.trim()}
            style={styles.searchButton}
          />
        </Card>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        {/* Search Results */}
        {searchResult && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.domainName}>
                {searchResult.domain}{searchResult.extension}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: searchResult.available ? theme.colors.success : theme.colors.error }
              ]}>
                <Text style={styles.statusText}>
                  {searchResult.available ? 'Available' : 'Taken'}
                </Text>
              </View>
            </View>
            
            {searchResult.available && (
              <Text style={styles.availableText}>
                Great choice! This domain is available for registration.
              </Text>
            )}
          </Card>
        )}

        {/* Registrars List */}
        {showRegistrars && registrars.length > 0 && (
          <View style={styles.registrarsSection}>
            <Text style={styles.sectionTitle}>KENIC Registrars</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a registrar to register your domain
            </Text>
            
            <FlatList
              data={registrars}
              renderItem={renderRegistrarItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              onEndReached={loadMoreRegistrars}
              onEndReachedThreshold={0.1}
            />
          </View>
        )}

        {/* Domain Suggestions */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Popular Suggestions</Text>
          <View style={styles.suggestionGrid}>
            {DomainsService.getPopularSuggestions().slice(0, 6).map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchTerm(suggestion);
                  setSelectedExtension('.me.ke');
                }}
              >
                <Text style={styles.suggestionText}>{suggestion}.me.ke</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  portfolioMessage: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  portfolioText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
    fontWeight: theme.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  searchCard: {
    marginBottom: theme.spacing.lg,
  },
  searchLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.md,
  },
  picker: {
    height: 50,
  },
  searchButton: {
    marginTop: theme.spacing.md,
  },
  resultCard: {
    marginBottom: theme.spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  domainName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.white,
  },
  availableText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
  },
  registrarsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  registrarCard: {
    marginBottom: theme.spacing.md,
  },
  registrarContent: {
    padding: theme.spacing.sm,
  },
  registrarName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  registrarContact: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  registrarEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  registerButton: {
    alignSelf: 'stretch',
    minHeight: 36,
    paddingHorizontal: theme.spacing.lg,
  },
  suggestionsSection: {
    marginBottom: theme.spacing.xl,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  suggestionItem: {
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  suggestionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
