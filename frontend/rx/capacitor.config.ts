import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xprescription.app',
  appName: 'X Prescription',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#3880ff",
      splashFullScreen: true,
      splashImmersive: true
    },
    Share: {
      defaultTitle: 'Share Prescription',
      defaultDialogTitle: 'Share via'
    },
    Filesystem: {
      directory: 'DOCUMENTS'
    }
  }
};

export default config;