import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bd0a7a79da1b4a79a843e7ba48f6af35',
  appName: 'audio-key-guardian',
  webDir: 'dist',
  server: {
    url: 'https://bd0a7a79-da1b-4a79-a843-e7ba48f6af35.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;