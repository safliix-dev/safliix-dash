import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type FinancePubEntry = {
  order: string;
  clientName: string;
  title: string;
  views: string | number;
  clicks: string | number;
};

type Props = {
  periodStart: string;
  periodEnd: string;
  entries: FinancePubEntry[];
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
    backgroundColor: "#F97316",
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
    fontSize: 10,
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
  colOrder:  { width: "10%", paddingHorizontal: 6 },
  colClient: { width: "25%", paddingHorizontal: 6 },
  colTitle:  { width: "35%", paddingHorizontal: 6 },
  colViews:  { width: "15%", paddingHorizontal: 6, textAlign: "center" },
  colClicks: { width: "15%", paddingHorizontal: 6, textAlign: "center" },
  headerText: { fontSize: 10, fontWeight: 700 },
  rowText: { fontSize: 10 },
  footerLine: { marginTop: 8, fontSize: 9, textAlign: "right", fontStyle: "italic" },
});

const fmt = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v.toString() : "";
  return v;
};

export function FinancePubReport({ periodStart, periodEnd, entries }: Props) {
  const rows = [...entries];
  while (rows.length < 10) {
    rows.push({ order: "", clientName: "", title: "", views: "", clicks: "" });
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>RAPPORT GENERAL DES PUBS</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoCell}></Text>
          <Text style={styles.infoCell}></Text>
          <Text style={styles.infoCell}></Text>
          <Text style={[styles.infoCell, { textAlign: "right" }, styles.infoCellLast]}>
            <Text style={styles.infoCellLabel}>Période</Text>{"  "}{periodStart}{"  au  "}{periodEnd}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.colOrder,  styles.headerText]}>N° D&apos;ORDRE</Text>
            <Text style={[styles.colClient, styles.headerText]}>CLIENTS</Text>
            <Text style={[styles.colTitle,  styles.headerText]}>TITRE DE LA PUB</Text>
            <Text style={[styles.colViews,  styles.headerText]}>NOMBRE DE VUS</Text>
            <Text style={[styles.colClicks, styles.headerText]}>NOMBRE DE CLIQUE</Text>
          </View>
          {rows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[styles.colOrder,  styles.rowText]}>{fmt(row.order)}</Text>
              <Text style={[styles.colClient, styles.rowText]}>{fmt(row.clientName)}</Text>
              <Text style={[styles.colTitle,  styles.rowText]}>{fmt(row.title)}</Text>
              <Text style={[styles.colViews,  styles.rowText]}>{fmt(row.views)}</Text>
              <Text style={[styles.colClicks, styles.rowText]}>{fmt(row.clicks)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerLine}>Généré automatiquement</Text>
      </Page>
    </Document>
  );
}
