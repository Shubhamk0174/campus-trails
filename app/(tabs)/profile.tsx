import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { colorScheme, themePreference, setThemePreference } = useTheme();
  const colors = Colors[colorScheme ?? "light"];
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user!.id);

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully");
      setEditing(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const getThemeIcon = () => {
    if (themePreference === "system") return "gear";
    if (themePreference === "dark") return "moon.fill";
    return "sun.max.fill";
  };

  const getThemeLabel = () => {
    if (themePreference === "system") return "System";
    if (themePreference === "dark") return "Dark";
    return "Light";
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatarLarge,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <IconSymbol name="person.circle" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile?.full_name || "User"}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
          {isAdmin && (
            <View
              style={[
                styles.adminBadge,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <IconSymbol name="crown.fill" size={14} color={colors.warning} />
              <Text style={[styles.adminBadgeText, { color: colors.warning }]}>
                Admin
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Places
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.cardBorder }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Reviews
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.cardBorder }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {new Date(profile?.created_at || "").toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Joined
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PREFERENCES
          </Text>

          {/* Theme Selection */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => {
              Alert.alert(
                "Choose Theme",
                "Select your preferred theme appearance",
                [
                  {
                    text: `☀️ Light${themePreference === "light" ? " ✓" : ""}`,
                    onPress: () => setThemePreference("light"),
                  },
                  {
                    text: `🌙 Dark${themePreference === "dark" ? " ✓" : ""}`,
                    onPress: () => setThemePreference("dark"),
                  },
                  {
                    text: `⚙️ System${themePreference === "system" ? " ✓" : ""}`,
                    onPress: () => setThemePreference("system"),
                  },
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                ],
                { cancelable: true },
              );
            }}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <IconSymbol
                  name={getThemeIcon()}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Theme
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {getThemeLabel()}
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACCOUNT
          </Text>

          {/* Edit Profile */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => setEditing(true)}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <IconSymbol name="pencil" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Edit Profile
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Update your personal information
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              styles.settingItemLast,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconContainer,
                  { backgroundColor: colors.error + "15" },
                ]}
              >
                <IconSymbol
                  name="rectangle.portrait.and.arrow.right"
                  size={20}
                  color={colors.error}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.error }]}>
                  Logout
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sign out of your account
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Campus Trails v1.0
          </Text>
        </View>
      </View>

      {/* Edit Profile Modal */}
      {editing && (
        <View
          style={[styles.modal, { backgroundColor: colors.background + "F0" }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditing(false);
                  setFullName(profile?.full_name || "");
                }}
              >
                <IconSymbol
                  name="xmark"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your name"
                placeholderTextColor={colors.placeholder}
                editable={!loading}
              />

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.cardBorder,
                    color: colors.textSecondary,
                  },
                ]}
                value={user?.email}
                editable={false}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: colors.backgroundTertiary },
                ]}
                onPress={() => {
                  setEditing(false);
                  setFullName(profile?.full_name || "");
                }}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingItemLast: {
    marginBottom: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    padding: 20,
    paddingTop: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {},
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
