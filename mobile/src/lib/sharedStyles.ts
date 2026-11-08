import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const sharedStyles = StyleSheet.create({
  // Auth screens (login/signup/forgot-password)
  authScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  authBrand: {
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authBrandText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  authForm: {
    width: "100%",
    maxWidth: 360,
    gap: 16,
  },
  input: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.pink,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  errorText: {
    fontSize: 13,
    color: colors.red,
  },
  mutedText: {
    fontSize: 13,
    color: colors.textDim,
  },
  linkMuted: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textDim,
  },
  linkBold: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.pink,
  },

  // Screen headers (used across all tab screens)
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  iconButton: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    padding: 8,
  },

  // Generic list / card patterns
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textDim,
    textAlign: "center",
    maxWidth: 280,
  },
  centeredLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
