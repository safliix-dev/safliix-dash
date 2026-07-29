import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type AbonnementEntry = {
  order: string;
  title: string;
  category: string;
  format: string;
  // subscriptions supprimé
  catalogDuration: string | number;
  viewingTime: string | number;
  viewingPercentage: string | number;
  revenue: string | number;
  // Nouveaux champs pour les stats globales
  globalCatalogDuration: string | number;
  globalViewingTime: string | number;
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
  // Ajustement des largeurs des colonnes (suppression de colSubs)
  colOrder:       { width: "6%",  paddingHorizontal: 4 },
  colTitle:       { width: "16%", paddingHorizontal: 4 },
  colCategory:    { width: "9%",  paddingHorizontal: 4 },
  colFormat:      { width: "7%",  paddingHorizontal: 4 },
  colCatalog:     { width: "11%", paddingHorizontal: 4, textAlign: "center" },
  colViewing:     { width: "11%", paddingHorizontal: 4, textAlign: "center" },
  colPercent:     { width: "12%", paddingHorizontal: 4, textAlign: "center" },
  colRevenue:     { width: "10%", paddingHorizontal: 4, textAlign: "center" },
  // Nouvelles colonnes pour les stats globales
  colGlobalCatalog: { width: "9%", paddingHorizontal: 4, textAlign: "center" },
  colGlobalViewing: { width: "9%", paddingHorizontal: 4, textAlign: "center" },
  headerText: { fontSize: 8, fontWeight: 700 },
  rowText: { fontSize: 9 },
  footerLine: { marginTop: 8, fontSize: 9, textAlign: "right", fontStyle: "italic" },
  // Style pour la section des totaux
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    borderTop: "1.5 solid #0EA5E9",
    minHeight: 22,
    alignItems: "center",
  },
  totalText: { fontSize: 9, fontWeight: "bold" },
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
    rows.push({ 
      order: "", 
      title: "", 
      category: "", 
      format: "", 
      catalogDuration: "", 
      viewingTime: "", 
      viewingPercentage: "", 
      revenue: "",
      globalCatalogDuration: "",
      globalViewingTime: "",
    });
  }

  // Récupérer les stats globales depuis la première entrée non vide
  const firstValidEntry = entries.find(e => e.title !== "");
  const globalCatalogDuration = firstValidEntry?.globalCatalogDuration || "";
  const globalViewingTime = firstValidEntry?.globalViewingTime || "";

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
          <Text style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>TOTAL CATALOGUE :</Text> {fmt(globalCatalogDuration)}
          </Text>
          <Text style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>VISIONNAGE TOTAL :</Text> {fmt(globalViewingTime)}
          </Text>
          <Text style={[styles.infoCell, { textAlign: "right" }, styles.infoCellLast]}>
            <Text style={styles.infoCellLabel}>Période</Text>{"  "}{periodStart}{"  au  "}{periodEnd}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.colOrder, styles.headerText]}>N°</Text>
            <Text style={[styles.colTitle, styles.headerText]}>TITRE</Text>
            <Text style={[styles.colCategory, styles.headerText]}>CATÉGORIE</Text>
            <Text style={[styles.colFormat, styles.headerText]}>FORMAT</Text>
            <Text style={[styles.colCatalog, styles.headerText]}>CATALOGUE (min)</Text>
            <Text style={[styles.colViewing, styles.headerText]}>VISIONNAGE (min)</Text>
            <Text style={[styles.colPercent, styles.headerText]}>% VISIONNAGE</Text>
            <Text style={[styles.colRevenue, styles.headerText]}>REVENUS (€)</Text>
            <Text style={[styles.colGlobalCatalog, styles.headerText]}>TOTAL CATALOGUE (min)</Text>
            <Text style={[styles.colGlobalViewing, styles.headerText]}>VISIONNAGE TOTAL (min)</Text>
          </View>
          
          {rows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[styles.colOrder, styles.rowText]}>{fmt(row.order)}</Text>
              <Text style={[styles.colTitle, styles.rowText]}>{fmt(row.title)}</Text>
              <Text style={[styles.colCategory, styles.rowText]}>{fmt(row.category)}</Text>
              <Text style={[styles.colFormat, styles.rowText]}>{fmt(row.format)}</Text>
              <Text style={[styles.colCatalog, styles.rowText]}>{fmt(row.catalogDuration)}</Text>
              <Text style={[styles.colViewing, styles.rowText]}>{fmt(row.viewingTime)}</Text>
              <Text style={[styles.colPercent, styles.rowText]}>{fmt(row.viewingPercentage)}</Text>
              <Text style={[styles.colRevenue, styles.rowText]}>{fmt(row.revenue)}</Text>
              <Text style={[styles.colGlobalCatalog, styles.rowText]}>{fmt(row.globalCatalogDuration)}</Text>
              <Text style={[styles.colGlobalViewing, styles.rowText]}>{fmt(row.globalViewingTime)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerLine}>Généré automatiquement</Text>
      </Page>
    </Document>
  );
}