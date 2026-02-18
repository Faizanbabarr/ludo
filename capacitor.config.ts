import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ludo.game',
  appName: 'Ludo Star',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
