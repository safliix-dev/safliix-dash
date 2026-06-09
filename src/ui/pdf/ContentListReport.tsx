import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type ContentListEntry = {
  order: string;
  rightsholderName: string;
  title: string;
  category: string;
  format: string;
};

type ContentType = "films" | "series" | "divers";

type Props = {
  contentType: ContentType;
  periodStart: string;
  periodEnd: string;
  entries: ContentListEntry[];
};

const TITLES: Record<ContentType, string> = {
  films:  "LISTE DES FILMS",
  series: "LISTE DES SERIES",
  divers: "LISTE DES VIDEOS DIVERS",
};

const TITLE_LABELS: Record<ContentType, string> = {
  films:  "TITRE DU FILMS",
  series: "TITRE DU SERIE",
  divers: "TITRE DE LA VIDEO",
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
    backgroundColor: "#14B8A6",
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
  colOrder:       { width: "10%", paddingHorizontal: 6 },
  colRightsholder:{ width: "22%", paddingHorizontal: 6 },
  colTitle:       { width: "34%", paddingHorizontal: 6 },
  colCategory:    { width: "20%", paddingHorizontal: 6 },
  colFormat:      { width: "14%", paddingHorizontal: 6 },
  headerText: { fontSize: 10, fontWeight: 700 },
  rowText: { fontSize: 10 },
  footerLine: { marginTop: 8, fontSize: 9, textAlign: "right", fontStyle: "italic" },
});

const fmt = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v.toString() : "";
  return v;
};

export function ContentListReport({ contentType, periodStart, periodEnd, entries }: Props) {
  const rows = [...entries];
  while (rows.length < 10) {
    rows.push({ order: "", rightsholderName: "", title: "", category: "", format: "" });
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{TITLES[contentType]}</Text>
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
            <Text style={[styles.colOrder,        styles.headerText]}>N° D&apos;ORDRE</Text>
            <Text style={[styles.colRightsholder,  styles.headerText]}>NOM DE L&apos;AYANT DROIT</Text>
            <Text style={[styles.colTitle,         styles.headerText]}>{TITLE_LABELS[contentType]}</Text>
            <Text style={[styles.colCategory,      styles.headerText]}>CATEGORIE</Text>
            <Text style={[styles.colFormat,        styles.headerText]}>FORMAT</Text>
          </View>
          {rows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[styles.colOrder,        styles.rowText]}>{fmt(row.order)}</Text>
              <Text style={[styles.colRightsholder,  styles.rowText]}>{fmt(row.rightsholderName)}</Text>
              <Text style={[styles.colTitle,         styles.rowText]}>{fmt(row.title)}</Text>
              <Text style={[styles.colCategory,      styles.rowText]}>{fmt(row.category)}</Text>
              <Text style={[styles.colFormat,        styles.rowText]}>{fmt(row.format)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerLine}>Généré automatiquement</Text>
      </Page>
    </Document>
  );
}
