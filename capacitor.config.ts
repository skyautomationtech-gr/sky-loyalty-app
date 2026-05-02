import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skytech.loyalty',
  appName: 'Sky Loyalty',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#F8FFFE',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#00BFA6',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
  },
  server: {
    androidScheme: 'https',
  }
};

export default config;
