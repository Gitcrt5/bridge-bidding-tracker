import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Game, Board, Bid, LeadCard, formatBid, getSuitSymbol } from "@/types/bridge";
import { parsePBN, ParsedPBNBoard, hasBiddingConflict, hasLeadConflict } from "@/lib/pbnParser";

interface ConflictResolution {
  boardNumber: number;
  usePBNBidding: boolean | null;
  usePBNLead: boolean | null;
}

interface PBNImportModalProps {
  visible: boolean;
  game: Game;
  onClose: () => void;
  onMerge: (updatedGame: Game) => void;
}

export function PBNImportModal({ visible, game, onClose, onMerge }: PBNImportModalProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedBoards, setParsedBoards] = useState<ParsedPBNBoard[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [step, setStep] = useState<"select" | "resolve" | "confirm">("select");

  const resetState = () => {
    setLoading(false);
    setError(null);
    setParsedBoards([]);
    setConflicts([]);
    setStep("select");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePickFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "application/octet-stream", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const parseResult = parsePBN(content);

      if (parseResult.boards.length === 0) {
        setError("No boards found in the PBN file.");
        setLoading(false);
        return;
      }

      setParsedBoards(parseResult.boards);

      const newConflicts: ConflictResolution[] = [];
      for (const pbnBoard of parseResult.boards) {
        const existingBoard = game.boards.find((b) => b.number === pbnBoard.number);
        if (existingBoard) {
          const biddingConflict = hasBiddingConflict(existingBoard, pbnBoard);
          const leadConflict = hasLeadConflict(existingBoard, pbnBoard);

          if (biddingConflict || leadConflict) {
            newConflicts.push({
              boardNumber: pbnBoard.number,
              usePBNBidding: biddingConflict ? null : false,
              usePBNLead: leadConflict ? null : false,
            });
          }
        }
      }

      setConflicts(newConflicts);
      setStep(newConflicts.length > 0 ? "resolve" : "confirm");
      setLoading(false);
    } catch (err) {
      console.error("Error picking file:", err);
      setError("Failed to read the PBN file. Please try again.");
      setLoading(false);
    }
  };

  const updateConflict = (boardNumber: number, field: "usePBNBidding" | "usePBNLead", value: boolean) => {
    setConflicts((prev) =>
      prev.map((c) => (c.boardNumber === boardNumber ? { ...c, [field]: value } : c))
    );
  };

  const allConflictsResolved = conflicts.every(
    (c) => (c.usePBNBidding !== null || !hasBiddingConflictForBoard(c.boardNumber)) &&
           (c.usePBNLead !== null || !hasLeadConflictForBoard(c.boardNumber))
  );

  function hasBiddingConflictForBoard(boardNumber: number): boolean {
    const existingBoard = game.boards.find((b) => b.number === boardNumber);
    const pbnBoard = parsedBoards.find((b) => b.number === boardNumber);
    if (!existingBoard || !pbnBoard) return false;
    return hasBiddingConflict(existingBoard, pbnBoard);
  }

  function hasLeadConflictForBoard(boardNumber: number): boolean {
    const existingBoard = game.boards.find((b) => b.number === boardNumber);
    const pbnBoard = parsedBoards.find((b) => b.number === boardNumber);
    if (!existingBoard || !pbnBoard) return false;
    return hasLeadConflict(existingBoard, pbnBoard);
  }

  const handleMerge = () => {
    const updatedBoards = game.boards.map((board) => {
      const pbnBoard = parsedBoards.find((p) => p.number === board.number);
      if (!pbnBoard) return board;

      const conflict = conflicts.find((c) => c.boardNumber === board.number);

      const updatedBoard: Board = { ...board };

      if (pbnBoard.hands) {
        updatedBoard.hands = pbnBoard.hands;
      }

      if (pbnBoard.doubleDummy) {
        updatedBoard.doubleDummy = pbnBoard.doubleDummy;
      }

      if (pbnBoard.bids && pbnBoard.bids.length > 0) {
        if (!conflict || conflict.usePBNBidding === true) {
          updatedBoard.bids = pbnBoard.bids;
        } else if (conflict?.usePBNBidding === false) {
        }
      }

      if (pbnBoard.leadCard) {
        if (!conflict || conflict.usePBNLead === true) {
          updatedBoard.result = {
            ...updatedBoard.result,
            leadCard: pbnBoard.leadCard,
          };
        }
      }

      return updatedBoard;
    });

    const updatedGame: Game = {
      ...game,
      boards: updatedBoards,
    };

    onMerge(updatedGame);
    handleClose();
  };

  const getExistingBidsPreview = (boardNumber: number): string => {
    const board = game.boards.find((b) => b.number === boardNumber);
    if (!board || board.bids.length === 0) return "None";
    return board.bids.slice(0, 4).map(formatBid).join(" - ") + (board.bids.length > 4 ? "..." : "");
  };

  const getPBNBidsPreview = (boardNumber: number): string => {
    const pbnBoard = parsedBoards.find((b) => b.number === boardNumber);
    if (!pbnBoard || !pbnBoard.bids || pbnBoard.bids.length === 0) return "None";
    return pbnBoard.bids.slice(0, 4).map(formatBid).join(" - ") + (pbnBoard.bids.length > 4 ? "..." : "");
  };

  const getExistingLeadPreview = (boardNumber: number): string => {
    const board = game.boards.find((b) => b.number === boardNumber);
    if (!board?.result.leadCard) return "None";
    return `${board.result.leadCard.rank}${getSuitSymbol(board.result.leadCard.suit)}`;
  };

  const getPBNLeadPreview = (boardNumber: number): string => {
    const pbnBoard = parsedBoards.find((b) => b.number === boardNumber);
    if (!pbnBoard?.leadCard) return "None";
    return `${pbnBoard.leadCard.rank}${getSuitSymbol(pbnBoard.leadCard.suit)}`;
  };

  const renderSelectStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <Feather name="file-text" size={48} color={theme.link} />
      </View>
      <ThemedText type="h4" style={styles.title}>
        Import PBN File
      </ThemedText>
      <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
        Select a PBN file from your device to import hand records and double dummy analysis.
      </ThemedText>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: theme.alertActive + "15", borderColor: theme.alertActive }]}>
          <Feather name="alert-circle" size={16} color={theme.alertActive} />
          <ThemedText type="small" style={{ color: theme.alertActive, flex: 1 }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <Pressable
        onPress={handlePickFile}
        disabled={loading}
        style={[
          styles.selectButton,
          { backgroundColor: theme.link },
          loading && { opacity: 0.7 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Feather name="upload" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Select PBN File
            </ThemedText>
          </>
        )}
      </Pressable>
    </View>
  );

  const renderResolveStep = () => (
    <View style={styles.stepContent}>
      <ThemedText type="h4" style={styles.title}>
        Resolve Conflicts
      </ThemedText>
      <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
        Some boards have data in both your game and the PBN file. Choose which to keep:
      </ThemedText>

      <ScrollView style={styles.conflictsList} contentContainerStyle={styles.conflictsContent}>
        {conflicts.map((conflict) => (
          <View
            key={conflict.boardNumber}
            style={[styles.conflictCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
          >
            <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
              Board {conflict.boardNumber}
            </ThemedText>

            {hasBiddingConflictForBoard(conflict.boardNumber) ? (
              <View style={styles.conflictSection}>
                <ThemedText type="small" style={[styles.conflictLabel, { color: theme.textSecondary }]}>
                  Bidding
                </ThemedText>
                <Pressable
                  onPress={() => updateConflict(conflict.boardNumber, "usePBNBidding", false)}
                  style={[
                    styles.conflictOption,
                    { borderColor: conflict.usePBNBidding === false ? theme.link : theme.border },
                    conflict.usePBNBidding === false && { backgroundColor: theme.link + "15" },
                  ]}
                >
                  <View style={styles.radioOuter}>
                    {conflict.usePBNBidding === false ? (
                      <View style={[styles.radioInner, { backgroundColor: theme.link }]} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="small" style={{ fontWeight: "500" }}>Keep Existing</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {getExistingBidsPreview(conflict.boardNumber)}
                    </ThemedText>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => updateConflict(conflict.boardNumber, "usePBNBidding", true)}
                  style={[
                    styles.conflictOption,
                    { borderColor: conflict.usePBNBidding === true ? theme.link : theme.border },
                    conflict.usePBNBidding === true && { backgroundColor: theme.link + "15" },
                  ]}
                >
                  <View style={styles.radioOuter}>
                    {conflict.usePBNBidding === true ? (
                      <View style={[styles.radioInner, { backgroundColor: theme.link }]} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="small" style={{ fontWeight: "500" }}>Use PBN</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {getPBNBidsPreview(conflict.boardNumber)}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            ) : null}

            {hasLeadConflictForBoard(conflict.boardNumber) ? (
              <View style={styles.conflictSection}>
                <ThemedText type="small" style={[styles.conflictLabel, { color: theme.textSecondary }]}>
                  Opening Lead
                </ThemedText>
                <View style={styles.leadOptions}>
                  <Pressable
                    onPress={() => updateConflict(conflict.boardNumber, "usePBNLead", false)}
                    style={[
                      styles.leadOption,
                      { borderColor: conflict.usePBNLead === false ? theme.link : theme.border },
                      conflict.usePBNLead === false && { backgroundColor: theme.link + "15" },
                    ]}
                  >
                    <View style={styles.radioOuter}>
                      {conflict.usePBNLead === false ? (
                        <View style={[styles.radioInner, { backgroundColor: theme.link }]} />
                      ) : null}
                    </View>
                    <ThemedText type="small">Keep: {getExistingLeadPreview(conflict.boardNumber)}</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => updateConflict(conflict.boardNumber, "usePBNLead", true)}
                    style={[
                      styles.leadOption,
                      { borderColor: conflict.usePBNLead === true ? theme.link : theme.border },
                      conflict.usePBNLead === true && { backgroundColor: theme.link + "15" },
                    ]}
                  >
                    <View style={styles.radioOuter}>
                      {conflict.usePBNLead === true ? (
                        <View style={[styles.radioInner, { backgroundColor: theme.link }]} />
                      ) : null}
                    </View>
                    <ThemedText type="small">PBN: {getPBNLeadPreview(conflict.boardNumber)}</ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => setStep("select")}
          style={[styles.secondaryButton, { borderColor: theme.border }]}
        >
          <ThemedText type="body">Back</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setStep("confirm")}
          disabled={!allConflictsResolved}
          style={[
            styles.primaryButton,
            { backgroundColor: theme.link },
            !allConflictsResolved && { opacity: 0.5 },
          ]}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            Continue
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const renderConfirmStep = () => {
    const boardsWithHands = parsedBoards.filter((b) => b.hands).length;
    const boardsWithDD = parsedBoards.filter((b) => b.doubleDummy).length;
    const boardsWithBidding = parsedBoards.filter((b) => b.bids && b.bids.length > 0).length;
    const boardsWithLead = parsedBoards.filter((b) => b.leadCard).length;

    return (
      <View style={styles.stepContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.link + "15" }]}>
          <Feather name="check-circle" size={48} color={theme.link} />
        </View>
        <ThemedText type="h4" style={styles.title}>
          Ready to Import
        </ThemedText>
        <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
          The following data will be merged into your game:
        </ThemedText>

        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <Feather name="layers" size={18} color={theme.text} />
            <ThemedText type="body" style={{ flex: 1 }}>
              {parsedBoards.length} boards matched
            </ThemedText>
          </View>
          {boardsWithHands > 0 ? (
            <View style={styles.summaryRow}>
              <Feather name="grid" size={18} color={theme.text} />
              <ThemedText type="body" style={{ flex: 1 }}>
                {boardsWithHands} hand records
              </ThemedText>
            </View>
          ) : null}
          {boardsWithDD > 0 ? (
            <View style={styles.summaryRow}>
              <Feather name="bar-chart-2" size={18} color={theme.text} />
              <ThemedText type="body" style={{ flex: 1 }}>
                {boardsWithDD} double dummy analyses
              </ThemedText>
            </View>
          ) : null}
          {boardsWithBidding > 0 ? (
            <View style={styles.summaryRow}>
              <Feather name="message-square" size={18} color={theme.text} />
              <ThemedText type="body" style={{ flex: 1 }}>
                {boardsWithBidding} bidding sequences
              </ThemedText>
            </View>
          ) : null}
          {boardsWithLead > 0 ? (
            <View style={styles.summaryRow}>
              <Feather name="play" size={18} color={theme.text} />
              <ThemedText type="body" style={{ flex: 1 }}>
                {boardsWithLead} opening leads
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => setStep(conflicts.length > 0 ? "resolve" : "select")}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
          >
            <ThemedText type="body">Back</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleMerge}
            style={[styles.primaryButton, { backgroundColor: theme.link }]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Import
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.modal, { backgroundColor: theme.backgroundRoot }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Import PBN
            </ThemedText>
            <Pressable onPress={handleClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {step === "select" && renderSelectStep()}
          {step === "resolve" && renderResolveStep()}
          {step === "confirm" && renderConfirmStep()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    maxHeight: "90%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  stepContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  iconContainer: {
    alignSelf: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  title: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: BorderRadius.lg,
  },
  conflictsList: {
    maxHeight: 300,
  },
  conflictsContent: {
    gap: Spacing.md,
  },
  conflictCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  conflictSection: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  conflictLabel: {
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  conflictOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  leadOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  leadOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(128, 128, 128, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
});
