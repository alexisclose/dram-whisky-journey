import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9773b48596e74703b1f3c8301dc79fc2',
  appName: 'dram-whisky-journey',
  webDir: 'dist',
  server: {
    url: 'https://9773b485-96e7-4703-b1f3-c8301dc79fc2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#b7791f',
      backgroundColor: '#1a1625'
    }
  }
};

export default config;