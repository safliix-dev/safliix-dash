import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type RentalEntry = {
  order: string;
  title: string;
  category: string;
  format: string;
  rentals: number | string;
};

type Props = {
  rightsholder: string;
  periodStart: string;
  periodEnd: string;
  entries: RentalEntry[];
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
  colTitle: { width: "32%", paddingHorizontal: 6 },
  colCategory: { width: "20%", paddingHorizontal: 6 },
  colFormat: { width: "18%", paddingHorizontal: 6 },
  colRentals: { width: "18%", paddingHorizontal: 6, textAlign: "center" },
  headerText: { fontSize: 10, fontWeight: 700 },
  rowText: { fontSize: 10 },
  footerLine: { marginTop: 8, fontSize: 9, textAlign: "right", fontStyle: "italic" },
});

export function ReportPdf({ rightsholder, periodStart, periodEnd, entries }: Props) {
  const rows = [...entries];
  while (rows.length < 10) {
    rows.push({ order: "", title: "", category: "", format: "", rentals: "" });
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>RAPPORT FINANCIER DE LOCATION DE FILMS</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>NOM DE L&apos;AYANT DROIT :</Text> {rightsholder}
          </Text>
          <Text style={styles.infoCell}></Text>
          <Text style={styles.infoCell}></Text>
          <Text style={[styles.infoCell, { textAlign: "right" }, styles.infoCellLast]}>
            <Text style={styles.infoCellLabel}>Période</Text> {periodStart}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.colOrder, styles.headerText]}>N° D&apos;ORDRE</Text>
            <Text style={[styles.colTitle, styles.headerText]}>TITRE DU FILMS</Text>
            <Text style={[styles.colCategory, styles.headerText]}>CATEGORIE</Text>
            <Text style={[styles.colFormat, styles.headerText]}>FORMAT</Text>
            <Text style={[styles.colRentals, styles.headerText]}>NOMBRE DE LOCATIONS</Text>
          </View>
          {rows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx === rows.length - 1 ? { borderBottomWidth: 0 } : null]}>
              <Text style={styles.colOrder}>{row.order}</Text>
              <Text style={styles.colTitle}>{row.title}</Text>
              <Text style={styles.colCategory}>{row.category}</Text>
              <Text style={styles.colFormat}>{row.format}</Text>
              <Text style={styles.colRentals}>{row.rentals}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerLine}>au {periodEnd}</Text>
      </Page>
    </Document>
  );
}
