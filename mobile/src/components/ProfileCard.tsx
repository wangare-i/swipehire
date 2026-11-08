import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Briefcase, MapPin, Sparkles } from "lucide-react-native";
import type { Profile } from "@/lib/types";
import { colors } from "@/lib/colors";

export default function ProfileCard({ profile }: { profile: Profile }) {
  const isRecruiter = profile.role === "recruiter";
  const tags = isRecruiter ? profile.specialties : profile.skills;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[profile.color, "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.initials}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.subtitle}>
          {profile.title}
          {isRecruiter && profile.company ? ` @ ${profile.company}` : ""}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {isRecruiter ? (
          <View style={styles.metaItem}>
            <Briefcase size={15} color={colors.pink} />
            <Text style={styles.metaText}>Recruits for {profile.company}</Text>
          </View>
        ) : (
          !!profile.location && (
            <View style={styles.metaItem}>
              <MapPin size={15} color={colors.pink} />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          )
        )}

        <Text style={styles.bio}>{profile.bio}</Text>

        {!!tags?.length && (
          <View style={styles.tagsSection}>
            <View style={styles.tagsLabel}>
              <Sparkles size={13} color={colors.pink} />
              <Text style={styles.tagsLabelText}>
                {isRecruiter ? "HIRING FOR" : "SKILLS"}
              </Text>
            </View>
            <View style={styles.tags}>
              {tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  avatar: {
    height: 80,
    width: 80,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  name: {
    fontSize: 19,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  bio: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  tagsSection: {
    marginTop: "auto",
  },
  tagsLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  tagsLabelText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.textDim,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
