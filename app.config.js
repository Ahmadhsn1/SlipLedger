module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === "production") {
    const needed = [
      "EXPO_PUBLIC_SUPABASE_URL",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "EXPO_PUBLIC_PRIVACY_URL",
      "EXPO_PUBLIC_TERMS_URL",
    ];
    const missing = needed.filter((k) => !process.env[k]);
    if (missing.length)
      throw Error("Production configuration missing: " + missing.join(", "));
  }
  if (process.env.EAS_BUILD_PROFILE === "preview") {
    return {
      ...config,
      name: "SlipLedger Preview",
      android: { ...config.android, package: "studio.fieldtab.mobile.preview" },
      ios: {
        ...config.ios,
        bundleIdentifier: "studio.fieldtab.mobile.preview",
      },
    };
  }
  return config;
};
