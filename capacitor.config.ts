import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restapp.manager',
  appName: 'RestApp',
  webDir: 'public',
  server: {
    url: 'https://restuaredappcolabtoday28-12-25.vercel.app', // ⚠️ REPLACE THIS WITH YOUR ACTUAL VERCEL URL
    cleartext: true
  },
  plugins: {
    BackgroundRunner: {
      label: 'com.restapp.manager.checkOrders',
      src: 'public/background.js',
      event: 'checkOrders',
      repeat: true,
      interval: 1,
      autoStart: true
    }
  }
};

export default config;
