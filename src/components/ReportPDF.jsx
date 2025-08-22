// src/components/ReportPDF.jsx
"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Styles très simples (A4, marges, titres centrés)
const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 28 },
  h1: { fontSize: 18, textAlign: "center", marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 11, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  sectionTitle: { fontSize: 12, textAlign: "center", marginTop: 12, marginBottom: 6, fontWeight: 700 },
  p: { fontSize: 10, marginBottom: 4, lineHeight: 1.3 },
  small: { fontSize: 9, color: "#666", textAlign: "center" },
});

// Libellés (comme dans ton code Python n8n)
const LABELS = {
  1:  "Fassade: Material und Zustand",
  2:  "Dach: Sichtbare Schäden",
  3:  "Fenster & Türen (Außen): Material und Zustand",
  4:  "Außenanlagen & Grundstück: Parkplätze und Zufahrten",
  5:  "Außenanlagen & Grundstück: Anlieferungsbereiche",
  6:  "Außenanlagen & Grundstück: Allgemeine Sauberkeit und Pflegezustand",
  7:  "Außenanlagen & Grundstück: Beleuchtung Außenbereich",
  8:  "Außenanlagen & Grundstück: Werbepylon/Schilder",
  9:  "Bodenbeläge: Art und Zustand",
  10: "Wände: Oberflächen und Zustand",
  11: "Decken: Oberflächen und Zustand",
  12: "Beleuchtung: Art, Helligkeit, Funktion",
  13: "Heizung, Lüftung, Klima (HLK): Zustand und Funktionalität",
  14: "Sanitäranlagen: Anzahl und Zustand",
  15: "Elektrik: Zustand der Installationen (Sicherungskästen, Verkabelung)",
  16: "Türen (Innen): Art, Zustand, Funktion",
  17: "Sonstige Ausstattung: Aufzüge/Rolltreppen (falls vorhanden)",
  18: "Sonstige Ausstattung: Sicherheitssysteme (Brand, Einbruch)",
  19: "Sonstige Ausstattung: Internet-/Telefonanschluss",
  20: "Sonstige Ausstattung: Lager- und Sozialräume",
  21: "Energieeffizienz: Hinweise auf Dämmung, moderne HLK, erneuerbare Energien (PV)",
  22: "Wassereffizienz: Moderne Sanitäranlagen, Regenwassernutzung",
  23: "Abfallmanagement: Trennsysteme, Entsorgungsmöglichkeiten",
  24: "Barrierefreiheit: Zugänglichkeit für alle Nutzergruppen",
  25: "Mieter-Engagement: Initiativen für nachhaltigen Betrieb",
};

export default function ReportPDF({ data }) {
  const assetId = data?.asset_id || "N/A";
  const manager = data?.asset_manager_name || "N/A";
  const date = data?.date || new Date().toISOString().split("T")[0];

  return (
    <Document title={`Pruefbericht_${assetId}_${date}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Prüfbericht – {assetId}</Text>
        <Text style={styles.subtitle}>Bewertung gemacht von {manager} • {date}</Text>

        {Array.from({ length: 25 }).map((_, idx) => {
          const i = idx + 1;
          const note = data?.[`point_${i}`] ?? "N/A";
          const comment = data?.[`point_${i}_comment`] ?? "";
          return (
            <View key={i}>
              <Text style={styles.sectionTitle}>{LABELS[i] || `Point ${i}`}</Text>
              <Text style={styles.p}>Note: {String(note)}</Text>
              {!!comment && <Text style={styles.p}>Kommentar: {comment}</Text>}
            </View>
          );
        })}

        {/* Pied de page avec numérotation */}
        <Text
          style={[styles.small, { position: "absolute", bottom: 18, left: 0, right: 0 }]}
          render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
