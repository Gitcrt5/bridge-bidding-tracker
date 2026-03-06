import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { createEmptyGame } from "@/types/bridge";
import { saveGame } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.fieldContainer}>
      <ThemedText
        type="small"
        style={[styles.fieldLabel, { color: theme.textSecondary }]}
      >
        {label}
        {required ? " *" : ""}
      </ThemedText>
      {children}
    </View>
  );
}

export default function CreateGameScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === "ios");
  const [partner, setPartner] = useState("");
  const [location, setLocation] = useState("");
  const [numberOfBoards, setNumberOfBoards] = useState("36");
  const [tournamentName, setTournamentName] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = tournamentName.trim() && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const game = createEmptyGame({
        date: date.toISOString(),
        partner: partner.trim(),
        location: location.trim(),
        numberOfBoards: parseInt(numberOfBoards, 10) || 36,
        tournamentName: tournamentName.trim(),
      });

      const savedGame = await saveGame(game);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("BiddingEntry", { gameId: savedGame.id, boardNumber: 1 });
    } catch (error) {
      console.error("Error saving game:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSaving(false);
    }
  }, [canSave, date, partner, location, numberOfBoards, tournamentName, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton
          onPress={() => navigation.goBack()}
          testID="button-cancel"
        >
          <ThemedText type="body" style={{ color: theme.link }}>
            Cancel
          </ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton
          onPress={handleSave}
          disabled={!canSave}
          testID="button-create"
        >
          <ThemedText
            type="body"
            style={{
              color: theme.link,
              opacity: canSave ? 1 : 0.4,
              fontWeight: "600",
            }}
          >
            Create
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, theme, canSave, handleSave]);

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing["3xl"],
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <FormField label="Date">
        {Platform.OS === "web" ? (
          <View style={[styles.dateInputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="calendar" size={18} color={theme.textSecondary} />
            <input
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value + 'T12:00:00');
                if (!isNaN(newDate.getTime())) {
                  setDate(newDate);
                }
              }}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 16,
                color: theme.text,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </View>
        ) : Platform.OS !== "ios" ? (
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
            testID="button-date-picker"
          >
            <Feather name="calendar" size={18} color={theme.textSecondary} />
            <ThemedText type="body">{formatDate(date)}</ThemedText>
          </Pressable>
        ) : null}
        {showDatePicker && Platform.OS !== "web" ? (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleDateChange}
            style={styles.datePicker}
          />
        ) : null}
      </FormField>

      <FormField label="Tournament Name" required>
        <TextInput
          value={tournamentName}
          onChangeText={setTournamentName}
          placeholder="e.g., Club Championship"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.textInput,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          testID="input-tournament-name"
        />
      </FormField>

      <FormField label="Partner">
        <TextInput
          value={partner}
          onChangeText={setPartner}
          placeholder="Partner's name"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.textInput,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          testID="input-partner"
        />
      </FormField>

      <FormField label="Location">
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., Bridge Club"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.textInput,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          testID="input-location"
        />
      </FormField>

      <FormField label="Number of Boards">
        <View style={styles.boardsRow}>
          {["18", "24", "27", "36"].map((num) => (
            <Pressable
              key={num}
              onPress={() => {
                setNumberOfBoards(num);
                Haptics.selectionAsync();
              }}
              style={[
                styles.boardOption,
                {
                  backgroundColor:
                    numberOfBoards === num
                      ? theme.link
                      : theme.backgroundDefault,
                  borderColor:
                    numberOfBoards === num ? theme.link : theme.border,
                },
              ]}
              testID={`button-boards-${num}`}
            >
              <ThemedText
                type="body"
                style={{
                  color: numberOfBoards === num ? "#FFFFFF" : theme.text,
                  fontWeight: numberOfBoards === num ? "600" : "400",
                }}
              >
                {num}
              </ThemedText>
            </Pressable>
          ))}
          <TextInput
            value={!["18", "24", "27", "36"].includes(numberOfBoards) ? numberOfBoards : ""}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, "");
              if (num) setNumberOfBoards(num);
            }}
            placeholder="Other"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            style={[
              styles.boardsInput,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            testID="input-boards-custom"
          />
        </View>
      </FormField>

    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  fieldContainer: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontWeight: "500",
  },
  textInput: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  dateButton: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dateInputContainer: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  datePicker: {
    alignSelf: "flex-start",
  },
  boardsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  boardOption: {
    width: 52,
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  boardsInput: {
    flex: 1,
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    textAlign: "center",
  },
});
