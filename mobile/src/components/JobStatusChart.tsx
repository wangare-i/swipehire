import { StyleSheet, Text, View } from "react-native";
import type { ApplicationStatus } from "@/lib/types";
import { colors } from "@/lib/colors";

const STAGES: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: "matched", label: "Matched", color: colors.pink },
  { status: "applied", label: "Applied", color: colors.blue },
  { status: "interviewing", label: "Interviewing", color: colors.amber },
  { status: "offer", label: "Offer", color: colors.emeraldDeep },
  { status: "rejected", label: "Rejected", color: colors.violet },
];

export default function JobStatusChart({
  statuses,
}: {
  statuses: ApplicationStatus[];
}) {
  const counts = STAGES.map(
    ({ status }) => statuses.filter((s) => (s ?? "matched") === status).length
  );
  const max = Math.max(1, ...counts);
  const total = statuses.length;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>TOTAL APPLICATIONS</Text>
      <Text style={styles.total}>{total}</Text>

      <View style={styles.rows}>
        {STAGES.map(({ status, label, color }, i) => {
          const count = counts[i];
          const widthPct = total === 0 ? 0 : Math.max((count / max) * 100, count > 0 ? 10 : 0);
          return (
            <View key={status} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${widthPct}%`, backgroundColor: color }]}>
                  {count > 0 && <Text style={styles.fillText}>{count}</Text>}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.textDim,
  },
  total: {
    marginTop: 2,
    marginBottom: 16,
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    width: 90,
    fontSize: 12,
    color: colors.textMuted,
  },
  track: {
    flex: 1,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 6,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  fillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
