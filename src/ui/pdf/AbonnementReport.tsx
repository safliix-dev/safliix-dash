import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type AbonnementEntry = {
  order: string;
  title: string;
  category: string;
  format: string;
  subscriptions: string | number;
  catalogDuration: string | number;
  viewingTime: string | number;
  viewingPercentage: string | number;
  revenue: string | number;
};

type Props = {
  rightsholderName: string;
  periodStart: string;
  periodEnd: string;
  entries: AbonnementEntry[];
  contentType?: "movie" | "serie";
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 32,
    paddingBottom: 24,
    backgroundColor: "#ffffff",
    fontSize: 9,
    color: "#000000",
  },
  banner: {
    backgroundColor: "#0EA5E9",
    paddingVertical: 10,
    alignItems: "center",
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
    fontSize: 9,
  },
  infoCellLabel: { fontStyle: "italic" },
  infoCellLast: { borderRightWidth: 0 },
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
  colOrder:       { width: "7%",  paddingHorizontal: 4 },
  colTitle:       { width: "18%", paddingHorizontal: 4 },
  colCategory:    { width: "10%", paddingHorizontal: 4 },
  colFormat:      { width: "8%",  paddingHorizontal: 4 },
  colSubs:        { width: "10%", paddingHorizontal: 4, textAlign: "center" },
  colCatalog:     { width: "12%", paddingHorizontal: 4, textAlign: "center" },
  colViewing:     { width: "12%", paddingHorizontal: 4, textAlign: "center" },
  colPercent:     { width: "13%", paddingHorizontal: 4, textAlign: "center" },
  colRevenue:     { width: "10%", paddingHorizontal: 4, textAlign: "center" },
  headerText: { fontSize: 8, fontWeight: 700 },
  rowText: { fontSize: 9 },
  footerLine: { marginTop: 8, fontSize: 9, textAlign: "right", fontStyle: "italic" },
});

const fmt = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v.toString() : "";
  return v;
};

export function AbonnementReport({ 
  rightsholderName, 
  periodStart, 
  periodEnd, 
  entries, 
  contentType = "movie" 
 }: Props) {
  const rows = [...entries];
  while (rows.length < 10) {
    rows.push({ order: "", title: "", category: "", format: "", subscriptions: "", catalogDuration: "", viewingTime: "", viewingPercentage: "", revenue: "" });
  }

   const title = contentType === "serie" 
    ? "RAPPORT FINANCIER DES ABONNEMENTS DE SÉRIES"
    : "RAPPORT FINANCIER DES ABONNEMENTS DE FILMS";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{title}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>NOM DE L&apos;AYANT DROIT :</Text> {rightsholderName}
          </Text>
          <Text style={styles.infoCell}></Text>
          <Text style={styles.infoCell}></Text>
          <Text style={[styles.infoCell, { textAlign: "right" }, styles.infoCellLast]}>
            <Text style={styles.infoCellLabel}>Période</Text>{"  "}{periodStart}{"  au  "}{periodEnd}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.colOrder,    styles.headerText]}>N° D&apos;ORDRE</Text>
            <Text style={[styles.colTitle,    styles.headerText]}>TITRE DU FILMS</Text>
            <Text style={[styles.colCategory, styles.headerText]}>CATEGORIE</Text>
            <Text style={[styles.colFormat,   styles.headerText]}>FORMAT</Text>
            <Text style={[styles.colSubs,     styles.headerText]}>NOMBRE D&apos;ABONNEMENT</Text>
            <Text style={[styles.colCatalog,  styles.headerText]}>TEMPS TOTAL DU CATALOGUE</Text>
            <Text style={[styles.colViewing,  styles.headerText]}>TEMPS DE VISIONNAGE</Text>
            <Text style={[styles.colPercent,  styles.headerText]}>POURCENTAGE DU TEMPS DE VISIONNAGE</Text>
            <Text style={[styles.colRevenue,  styles.headerText]}>REVENUS DES ABONNEMENTS</Text>
          </View>
          {rows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[styles.colOrder,    styles.rowText]}>{fmt(row.order)}</Text>
              <Text style={[styles.colTitle,    styles.rowText]}>{fmt(row.title)}</Text>
              <Text style={[styles.colCategory, styles.rowText]}>{fmt(row.category)}</Text>
              <Text style={[styles.colFormat,   styles.rowText]}>{fmt(row.format)}</Text>
              <Text style={[styles.colSubs,     styles.rowText]}>{fmt(row.subscriptions)}</Text>
              <Text style={[styles.colCatalog,  styles.rowText]}>{fmt(row.catalogDuration)}</Text>
              <Text style={[styles.colViewing,  styles.rowText]}>{fmt(row.viewingTime)}</Text>
              <Text style={[styles.colPercent,  styles.rowText]}>{fmt(row.viewingPercentage)}</Text>
              <Text style={[styles.colRevenue,  styles.rowText]}>{fmt(row.revenue)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerLine}>Généré automatiquement</Text>
      </Page>
    </Document>
  );
}
