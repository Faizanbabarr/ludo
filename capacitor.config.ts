import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ludo.game',
  appName: 'Roll Home',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
