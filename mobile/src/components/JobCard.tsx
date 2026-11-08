import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Wallet, Clock } from "lucide-react-native";
import type { Job } from "@/lib/types";
import { colors } from "@/lib/colors";

export default function JobCard({ job }: { job: Job }) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[job.color, "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.company}>{job.company}</Text>
        <Text style={styles.title}>{job.title}</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={15} color={colors.pink} />
            <Text style={styles.metaText}>
              {job.location}
              {job.remote ? " · Remote" : ""}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Wallet size={15} color={colors.pink} />
            <Text style={styles.metaText}>{job.salary}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={15} color={colors.pink} />
            <Text style={styles.metaText}>{job.postedAt}</Text>
          </View>
        </View>

        <Text style={styles.description}>{job.description}</Text>

        <View style={styles.tags}>
          {job.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  hero: {
    height: "40%",
    justifyContent: "flex-end",
    padding: 24,
  },
  company: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
    gap: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: "auto",
  },
  tag: {
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
});
