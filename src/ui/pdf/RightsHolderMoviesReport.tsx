import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type MovieReportEntry = {
  order: string;
  title: string;
  share: string | number;
  views: string | number;
  revenue: string | number;
};

type Props = {
  rightsholderName: string;
  periodStart: string;
  periodEnd: string;
  mode: "location" | "abonnement";
  entries: MovieReportEntry[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 32,
    paddingBottom: 24,
    backgroundColor: "#ffffff",
    fontSize: 10,
    color: "#000000",
  },
  banner: {
    backgroundColor: "#8BC34A",
    paddingVertical: 10,
    alignItems: "center",
  },
  bannerAlt: {
    backgroundColor: "#0EA5E9",
  },
  bannerText: { fontSize: 16, fontWeight: 700 },
  infoRow: {
    marginTop: 10,
    border: "0.8 solid #9e9e9e",
    flexDirection: "row",
  },
  infoCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRight: "0.8 solid #9e9e9e",
    fontSize: 10,
  },
  infoCellLabel: { fontStyle: "italic" },
  infoCellLast: { borderRight: "0 solid transparent" },
  table: {
    marginTop: 12,
    border: "0.8 solid #9e9e9e",
    borderTopWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    borderBottom: "0.8 solid #9e9e9e",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.8 solid #9e9e9e",
    minHeight: 22,
    alignItems: "center",
  },
  colOrder: { width: "12%", paddingHorizontal: 6 },
  colTitle: { width: "30%", paddingHorizontal: 6 },
  colShare: { width: "14%", paddingHorizontal: 6, textAlign: "center" },
  colViews: { width: "18%", paddingHorizontal: 6, textAlign: "center" },
  colRevenue: { width: "26%", paddingHorizontal: 6, textAlign: "center" },
  headerText: { fontSize: 10, fontWeight: 700 },
  rowText: { fontSize: 10 },
  footerLine: { marginTop: 8, fontSize: 9, textAlign: "right", fontStyle: "italic" },
});

const formatValue = (value: string | number) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? value.toString() : "";
  return value;
};

export function RightsHolderMoviesReport({ rightsholderName, periodStart, periodEnd, mode, entries }: Props) {
  const rows = [...entries];
  while (rows.length < 10) {
    rows.push({ order: "", title: "", share: "", views: "", revenue: "" });
  }

  const isLocation = mode === "location";
  const bannerTitle = isLocation ? "RAPPORT FINANCIER DE LOCATION DE FILMS" : "RAPPORT FINANCIER D'ABONNEMENT";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={[styles.banner, !isLocation && styles.bannerAlt]}>
          <Text style={styles.bannerText}>{bannerTitle}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>NOM DE L&apos;AYANT DROIT :</Text> {rightsholderName}
          </Text>
          <Text style={styles.infoCell}></Text>
          <Text style={styles.infoCell}></Text>
          <Text style={[styles.infoCell, { textAlign: "right" }, styles.infoCellLast]}>
            <Text style={styles.infoCellLabel}>Période</Text> {periodStart} - {periodEnd}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.colOrder, styles.headerText]}>N° D&apos;ORDRE</Text>
            <Text style={[styles.colTitle, styles.headerText]}>TITRE</Text>
            <Text style={[styles.colShare, styles.headerText]}>PART (%)</Text>
            <Text style={[styles.colViews, styles.headerText]}>
              {isLocation ? "NOMBRE DE LOCATIONS" : "NOMBRE DE VUES"}
            </Text>
            <Text style={[styles.colRevenue, styles.headerText]}>
              {isLocation ? "REVENUS LOCATION" : "REVENUS ABONNEMENT"}
            </Text>
          </View>
          {rows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx === rows.length - 1 ? { borderBottomWidth: 0 } : null]}>
              <Text style={[styles.colOrder, styles.rowText]}>{formatValue(row.order)}</Text>
              <Text style={[styles.colTitle, styles.rowText]}>{formatValue(row.title)}</Text>
              <Text style={[styles.colShare, styles.rowText]}>{formatValue(row.share)}</Text>
              <Text style={[styles.colViews, styles.rowText]}>{formatValue(row.views)}</Text>
              <Text style={[styles.colRevenue, styles.rowText]}>{formatValue(row.revenue)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerLine}>Généré automatiquement</Text>
      </Page>
    </Document>
  );
}
