import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, BridgeColors } from "@/constants/theme";
import { DoubleDummyResult, getSuitSymbol } from "@/types/bridge";

interface DoubleDummyTableProps {
  doubleDummy: DoubleDummyResult;
}

export function DoubleDummyTable({ doubleDummy }: DoubleDummyTableProps) {
  const { theme, isDark } = useTheme();

  const suitColors = {
    clubs: isDark ? BridgeColors.clubsLight : BridgeColors.clubs,
    diamonds: BridgeColors.diamonds,
    hearts: BridgeColors.hearts,
    spades: isDark ? BridgeColors.spadesLight : BridgeColors.spades,
    notrump: BridgeColors.noTrump,
  };

  const suits: Array<{ key: keyof typeof suitColors; symbol: string }> = [
    { key: "notrump", symbol: "NT" },
    { key: "spades", symbol: getSuitSymbol("S") },
    { key: "hearts", symbol: getSuitSymbol("H") },
    { key: "diamonds", symbol: getSuitSymbol("D") },
    { key: "clubs", symbol: getSuitSymbol("C") },
  ];

  const positions: Array<{ key: keyof DoubleDummyResult; label: string }> = [
    { key: "north", label: "N" },
    { key: "south", label: "S" },
    { key: "east", label: "E" },
    { key: "west", label: "W" },
  ];

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <View style={[styles.headerRow, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.cornerCell} />
        {suits.map((suit) => (
          <View key={suit.key} style={styles.headerCell}>
            <ThemedText
              style={[
                styles.suitHeader,
                { color: suitColors[suit.key] },
              ]}
            >
              {suit.symbol}
            </ThemedText>
          </View>
        ))}
      </View>

      {positions.map((pos) => (
        <View key={pos.key} style={[styles.dataRow, { borderTopColor: theme.border }]}>
          <View style={[styles.positionCell, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="small" style={{ fontWeight: "600" }}>
              {pos.label}
            </ThemedText>
          </View>
          {suits.map((suit) => {
            const tricks = doubleDummy[pos.key][suit.key];
            return (
              <View key={suit.key} style={styles.dataCell}>
                <ThemedText type="small" style={{ fontWeight: "500" }}>
                  {tricks}
                </ThemedText>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
  },
  cornerCell: {
    width: 32,
    paddingVertical: Spacing.xs,
  },
  headerCell: {
    flex: 1,
    paddingVertical: Spacing.xs,
    alignItems: "center",
  },
  suitHeader: {
    fontWeight: "700",
    fontSize: 14,
  },
  dataRow: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  positionCell: {
    width: 32,
    paddingVertical: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  dataCell: {
    flex: 1,
    paddingVertical: Spacing.xs,
    alignItems: "center",
  },
});
