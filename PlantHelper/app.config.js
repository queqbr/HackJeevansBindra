const fs = require('fs');
const path = require('path');

// Load base config from app.json to preserve most settings
const base = require('./app.json');

module.exports = ({ config }) => {
  const EXPO_PUBLIC_SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || process.env.SERVER_URL || '';
  const EXPO_PUBLIC_OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY || process.env.OPENAI_API_KEY || '';
  const EXPO_PUBLIC_OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  const merged = {
    ...base.expo,
    extra: {
      ...(base.expo.extra || {}),
      EXPO_PUBLIC_SERVER_URL,
      EXPO_PUBLIC_OPENAI_KEY,
      EXPO_PUBLIC_OPENAI_MODEL,
    },
  };

  return {
    ...config,
    expo: merged,
  };
};
