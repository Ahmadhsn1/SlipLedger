import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { cloud, backup, restore, deleteAccount, signInWithGoogle } from "./cloud";
import { T, Field, Button, useTheme } from "./UI";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authError = (error) =>
  error?.message || "We couldn’t complete that request. Please try again.";

function ModeSwitch({ mode, onChange, disabled }) {
  const { color } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        padding: 4,
        borderRadius: 13,
        backgroundColor: color.paper,
        borderWidth: 1,
        borderColor: color.line,
      }}
    >
      {[
        ["signIn", "Log in"],
        ["signUp", "Create account"],
      ].map(([value, label]) => {
        const selected = mode === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(value)}
            style={{
              flex: 1,
              minHeight: 42,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 10,
              backgroundColor: selected ? color.white : "transparent",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <T kind="label">{label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

function GoogleButton({ onPress, disabled }) {
  const { s, color } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        s.quiet,
        {
          flexDirection: "row",
          gap: 10,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <T kind="strong" style={{ color: "#4285F4", fontSize: 18 }}>
        G
      </T>
      <T kind="button" style={{ color: color.ink }}>
        Continue with Google
      </T>
    </Pressable>
  );
}

export function Account({ work, reload }) {
  const { s, color } = useTheme();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("signIn");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!cloud) return undefined;
    const { data } = cloud.auth.onAuthStateChange((_, session) =>
      setUser(session?.user || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const run = async (label, action) => {
    setBusy(label);
    setError("");
    setNotice("");
    const started = await work(label, async () => {
      try {
        await action();
      } catch (e) {
        setError(authError(e));
      } finally {
        setBusy("");
      }
    });
    if (!started) setBusy("");
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSent(false);
    setCode("");
    setError("");
    setNotice("");
  };

  const requestCode = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (mode === "signUp" && !name.trim()) {
      setError("Enter your name to create an account.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    run("Sending email code", async () => {
      const { error: requestError } = await cloud.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: mode === "signUp",
          ...(mode === "signUp" ? { data: { full_name: name.trim() } } : {}),
        },
      });
      if (requestError) throw requestError;
      setEmail(normalizedEmail);
      setSent(true);
      setNotice(`We sent a sign-in code to ${normalizedEmail}.`);
    });
  };

  const verifyCode = () => {
    const token = code.trim();
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    run("Verifying email code", async () => {
      const { error: verifyError } = await cloud.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: "email",
      });
      if (verifyError) throw verifyError;
      setCode("");
    });
  };

  if (!cloud)
    return (
      <View style={s.panel}>
        <T kind="strong">Local workspace</T>
        <T kind="note">
          Cloud backup is unavailable in this build. Your ledger remains on
          this device.
        </T>
      </View>
    );

  if (!user)
    return (
      <View style={[s.panel, { padding: 18, gap: 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image
            source={require("../assets/icon.png")}
            accessibilityLabel="SlipLedger"
            style={{ width: 48, height: 48, borderRadius: 12 }}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <T kind="cap">SLIPLEDGER ACCOUNT</T>
            <T kind="strong">Your records, within reach.</T>
          </View>
        </View>
        <T kind="note">
          Sign in to securely back up your ledger and original receipts. Your
          device workspace stays available offline.
        </T>

        <ModeSwitch
          mode={mode}
          onChange={changeMode}
          disabled={!!busy || sent}
        />

        {!sent ? (
          <>
            {mode === "signUp" && (
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                editable={!busy}
                returnKeyType="next"
              />
            )}
            <Field
              label="Email address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={requestCode}
            />
            {!!error && (
              <T accessibilityRole="alert" style={{ color: color.error }}>
                {error}
              </T>
            )}
            <Button disabled={!!busy} onPress={requestCode}>
              {busy === "Sending email code"
                ? "Sending code…"
                : mode === "signUp"
                  ? "Create account with email"
                  : "Continue with email"}
            </Button>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: color.line }}
              />
              <T kind="note">or</T>
              <View
                style={{ flex: 1, height: 1, backgroundColor: color.line }}
              />
            </View>
            <GoogleButton
              disabled={!!busy}
              onPress={() => run("Opening Google sign-in", signInWithGoogle)}
            />
            <T kind="note" style={{ textAlign: "center" }}>
              Password-free sign-in. We’ll email you a one-time code.
            </T>
          </>
        ) : (
          <>
            <View
              style={{
                gap: 5,
                padding: 14,
                borderRadius: 12,
                backgroundColor: color.paper,
              }}
            >
              <T kind="strong">Check your inbox</T>
              <T kind="note">{notice}</T>
            </View>
            <Field
              label="6-digit email code"
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={verifyCode}
            />
            {!!error && (
              <T accessibilityRole="alert" style={{ color: color.error }}>
                {error}
              </T>
            )}
            <Button disabled={!!busy} onPress={verifyCode}>
              {busy === "Verifying email code"
                ? "Verifying…"
                : "Verify and continue"}
            </Button>
            <Button
              quiet
              disabled={!!busy}
              onPress={() => {
                setSent(false);
                setCode("");
                setError("");
                setNotice("");
              }}
            >
              Change email address
            </Button>
            <Button quiet disabled={!!busy} onPress={requestCode}>
              Resend code
            </Button>
          </>
        )}
      </View>
    );

  return (
    <View style={s.panel}>
      <T kind="cap">PRIVATE CLOUD BACKUP</T>
      <T kind="strong">{user.email || "Signed in"}</T>
      <T kind="note">
        One private backup up to 24 MB. Backing up replaces the previous copy
        for this account.
      </T>
      <Button
        onPress={() =>
          Alert.alert(
            "Replace cloud backup?",
            "Upload this device’s ledger and original receipts to " +
            user.email +
            "?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Back up",
                onPress: () =>
                  work("Backing up", async () => {
                    await backup(user.id);
                    Alert.alert("Backup saved");
                  }),
              },
            ],
          )
        }
      >
        Back up workspace
      </Button>
      <Button
        quiet
        onPress={() =>
          work("Restoring backup", async () => {
            await restore(user.id);
            reload();
            Alert.alert("Workspace restored");
          })
        }
      >
        Restore to empty workspace
      </Button>
      <Button
        quiet
        onPress={() =>
          work("Signing out", async () => {
            const { error: signOutError } = await cloud.auth.signOut();
            if (signOutError) throw signOutError;
          })
        }
      >
        Sign out
      </Button>
      <Button
        quiet
        onPress={() =>
          Alert.alert(
            "Delete cloud account?",
            "This permanently deletes your cloud backup and login. Your local workspace stays on this device.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete account",
                style: "destructive",
                onPress: () => work("Deleting account", deleteAccount),
              },
            ],
          )
        }
      >
        Delete cloud account
      </Button>
    </View>
  );
}

export function AccountEntry({ onOpen }) {
  const { s } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!cloud) return undefined;
    const { data } = cloud.auth.onAuthStateChange((_, session) =>
      setUser(session?.user || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <View style={s.panel}>
      <T kind="cap">ACCOUNT & BACKUP</T>
      <T kind="strong">
        {!cloud
          ? "Local workspace"
          : user?.email || "Back up your workspace"}
      </T>
      <T kind="note">
        {!cloud
          ? "Cloud backup is not configured in this build."
          : user
            ? "Manage your private backup and account."
            : "Create an account or sign in to back up your ledger."}
      </T>
      {!!cloud && (
        <Button quiet onPress={onOpen}>
          {user ? "Manage account" : "Log in or create account"}
        </Button>
      )}
    </View>
  );
}
