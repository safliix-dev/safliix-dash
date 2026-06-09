import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type UserEntry = {
  order: string;
  fullName: string;
  country: string;
  email: string;
  phone: string;
};

type Props = {
  periodStart: string;
  periodEnd: string;
  entries: UserEntry[];
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
    backgroundColor: "#8B5CF6",
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
  colOrder:    { width: "10%", paddingHorizontal: 6 },
  colFullName: { width: "25%", paddingHorizontal: 6 },
  colCountry:  { width: "15%", paddingHorizontal: 6 },
  colEmail:    { width: "30%", paddingHorizontal: 6 },
  colPhone:    { width: "20%", paddingHorizontal: 6 },
  headerText: { fontSize: 10, fontWeight: 700 },
  rowText: { fontSize: 10 },
  footerLine: { marginTop: 8, fontSize: 9, textAlign: "right", fontStyle: "italic" },
});

const fmt = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v.toString() : "";
  return v;
};

export function UsersReport({ periodStart, periodEnd, entries }: Props) {
  const rows = [...entries];
  while (rows.length < 10) {
    rows.push({ order: "", fullName: "", country: "", email: "", phone: "" });
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>LISTE DES UTILISATEURS</Text>
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
            <Text style={[styles.colOrder,    styles.headerText]}>N° D&apos;ORDRE</Text>
            <Text style={[styles.colFullName, styles.headerText]}>NOM ET PRENOMS</Text>
            <Text style={[styles.colCountry,  styles.headerText]}>PAYS</Text>
            <Text style={[styles.colEmail,    styles.headerText]}>MAIL</Text>
            <Text style={[styles.colPhone,    styles.headerText]}>TELEPHONE</Text>
          </View>
          {rows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[styles.colOrder,    styles.rowText]}>{fmt(row.order)}</Text>
              <Text style={[styles.colFullName, styles.rowText]}>{fmt(row.fullName)}</Text>
              <Text style={[styles.colCountry,  styles.rowText]}>{fmt(row.country)}</Text>
              <Text style={[styles.colEmail,    styles.rowText]}>{fmt(row.email)}</Text>
              <Text style={[styles.colPhone,    styles.rowText]}>{fmt(row.phone)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerLine}>Généré automatiquement</Text>
      </Page>
    </Document>
  );
}
