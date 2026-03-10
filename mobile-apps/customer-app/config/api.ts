/**
 * API configuration - point to your deployed backend
 */
export const API_BASE_URL =
  __DEV__
    ? 'http://192.168.1.100:3000' // Replace with your local IP for device testing
    : 'https://albazdelivery.vercel.app';
