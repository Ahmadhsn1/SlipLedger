import React from "react";
import { Linking } from "react-native";
import { Button } from "./UI";
export function LegalLinks({ work }) {
  return (
    <>
      {[
        [process.env.EXPO_PUBLIC_PRIVACY_URL, "Privacy policy"],
        [process.env.EXPO_PUBLIC_TERMS_URL, "Terms of use"],
      ]
        .filter(([url]) => url)
        .map(([url, title]) => (
          <Button
            key={title}
            quiet
            onPress={() => work("Opening document", () => Linking.openURL(url))}
          >
            {title}
          </Button>
        ))}
    </>
  );
}
