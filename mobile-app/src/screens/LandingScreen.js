import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import FeatureCard from '../components/FeatureCard';

export default function LandingScreen({ navigation }) {
  const features = [
    {
      icon: <MaterialCommunityIcons name="handshake" size={28} color="#3B82F6" />,
      title: 'Lead Management',
      description: 'Track opportunities and close more deals efficiently',
    },
    {
      icon: <MaterialCommunityIcons name="chart-line" size={28} color="#3B82F6" />,
      title: 'Deal Tracking',
      description: 'Monitor your sales pipeline in real-time',
    },
    {
      icon: <Ionicons name="people" size={28} color="#3B82F6" />,
      title: 'Customer Profiles',
      description: 'Know your customers better with detailed profiles',
    },
    {
      icon: <MaterialCommunityIcons name="account-group" size={28} color="#3B82F6" />,
      title: 'Team Collaboration',
      description: 'Work together with role-based access',
    },
    {
      icon: <Ionicons name="call" size={28} color="#3B82F6" />,
      title: 'Call & Email',
      description: 'Communicate directly from the platform',
    },
    {
      icon: <MaterialCommunityIcons name="sync" size={28} color="#3B82F6" />,
      title: 'Real-time Sync',
      description: 'Access your CRM from web and mobile seamlessly',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="briefcase" size={32} color="#3B82F6" />
            </View>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Your Business CRM</Text>
          <Text style={styles.subheadline}>
            Manage relationships on the go
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Illustration */}
          <View style={styles.heroImageContainer}>
            <View style={styles.heroImagePlaceholder}>
              <MaterialCommunityIcons name="chart-box-outline" size={80} color="#3B82F6" />
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <TouchableOpacity
            style={styles.largeButton}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.largeButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLink}>
              Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#ffffff',
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  heroImageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  heroImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  featuresSection: {
    paddingTop: 40,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  bottomCta: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  largeButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  largeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLinkBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
