// src/components/ReportPDF.jsx
"use client";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 28 },
  h1: { fontSize: 18, textAlign: "center", marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 11, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  h2: { fontSize: 13, marginTop: 12, marginBottom: 6, fontWeight: 700 },
  h3: { fontSize: 12, marginTop: 8, marginBottom: 4, fontWeight: 700 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 220, fontSize: 10, color: "#222" },
  val: { fontSize: 10, color: "#111" },
  bulletWrap: { marginBottom: 6 },
  bullet: { fontSize: 10, lineHeight: 1.35 },
  indent: { marginLeft: 10 },
  meta: { fontSize: 9, color: "#444", marginTop: 2 },
  small: { fontSize: 9, color: "#666", textAlign: "center" },
  imagesRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  thumb: { width: 110, height: 80, marginRight: 6, marginBottom: 6, borderRadius: 2 },
});

const Safe = (v) => (v === null || v === undefined ? "" : String(v));

/** Récupère valeur et commentaire pour un point.
 *  1) essaie "point_<index>" (ancien schéma)
 *  2) sinon essaie "<index>" (schéma actuel dans page.jsx)
 */
function getPointData(data, pointIndex) {
  const keyOld = `point_${pointIndex}`;
  const keyNew = String(pointIndex);
  const note =
    data?.[keyOld] !== undefined ? data[keyOld] :
    data?.[keyNew] !== undefined ? data[keyNew] : undefined;
  const cmt =
    data?.[`${keyOld}_comment`] !== undefined ? data[`${keyOld}_comment`] :
    data?.[`${keyNew}_comment`] !== undefined ? data[`${keyNew}_comment`] : undefined;
  const imgs =
    data?.[`${keyOld}_images`] !== undefined ? data[`${keyOld}_images`] :
    data?.[`${keyNew}_images`] !== undefined ? data[`${keyNew}_images`] : [];
  return { note, cmt, imgs: Array.isArray(imgs) ? imgs : [] };
}

export default function ReportPDF({ data = {} }) {
  const assetId = data.asset_id || "N/A";
  const manager = data.asset_manager_name || "N/A";
  const date = data.date || new Date().toISOString().split("T")[0];

  const AvgRow = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.val}>{Safe(value)}</Text>
    </View>
  );

  const Item = ({ label, pointIndex }) => {
    const { note, cmt, imgs } = getPointData(data, pointIndex);
    return (
      <View style={styles.bulletWrap}>
        <Text style={styles.bullet}>• {label}</Text>
        {(note !== undefined || cmt) && (
          <View style={styles.indent}>
            {note !== undefined && <Text style={styles.meta}>Note: {String(note)}</Text>}
            {cmt && <Text style={styles.meta}>Kommentar: {cmt}</Text>}
          </View>
        )}
        {imgs.length > 0 && (
          <View style={[styles.imagesRow, styles.indent]}>
            {imgs.map((b64, idx) => (
              <Image key={idx} style={styles.thumb} src={`data:image/jpeg;base64,${b64}`} />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Document title={`Pruefbericht_${assetId}_${date}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Prüfbericht – {assetId}</Text>
        <Text style={styles.subtitle}>Bewertung gemacht von {manager} • {date}</Text>

        {/* Résumé des moyennes (Ø) — vient directement des champs ajoutés au payload */}
        <Text style={styles.h2}>Zusammenfassung (Ø)</Text>
        <AvgRow label="Building envelope" value={data.building_envelope} />
        <AvgRow label="Exterior facilities" value={data.exterior_facilities} />
        <AvgRow label="Interior areas" value={data.interior_areas} />
        <AvgRow label="Technical equipment" value={data.technical_equipment} />
        <AvgRow label="Sustainability / ESG" value={data.sustainability_esg} />
        <AvgRow label="Significant structural defects" value={data.significant_structural_defects} />
        <AvgRow label="Location / Market situation" value={data.location_market_situation} />

        {/* 1. Allgemeiner Zustand des Objekts */}
        <Text style={styles.h2}>1. Allgemeiner Zustand des Objekts</Text>

        <Text style={styles.h3}>A. Gebäudehülle</Text>
        <Item label="Fassade: Material und Zustand" pointIndex={1} />
        <Item label="Dach: sichtbare Schäden, Undichtigkeiten" pointIndex={2} />
        <Item label="Fenster & Außentüren: Material, Zustand, Dichtigkeit" pointIndex={3} />
        <Item label="Eingangsbereich: Gestaltung, Funktionalität, Barrierefreiheit, Sauberkeit" pointIndex={4} />

        <Text style={styles.h3}>B. Außenanlagen</Text>
        <Item label="Parkplätze und Zufahrten: Belag, Markierungen, Ordnung" pointIndex={5} />
        <Item label="Anlieferungsbereiche: Funktionalität, Zugänglichkeit" pointIndex={6} />
        <Item label="Grünanlagen / Sauberkeit / Pflegezustand: Zustand, Gestaltung, Pflege, Müll, Verschmutzungen, Ordnung, regelmäßige Instandhaltung, Gesamteindruck" pointIndex={7} />
        <Item label="Außenbeleuchtung: ausreichend, funktionsfähig" pointIndex={8} />
        <Item label="Werbepylon/Schilder: Sichtbarkeit, Pflege, Genehmigung" pointIndex={9} />

        <Text style={styles.h3}>C. Innenbereiche</Text>
        <Item label="Bodenbeläge: Art, Zustand" pointIndex={10} />
        <Item label="Wände: Oberflächen, Schäden" pointIndex={11} />
        <Item label="Decken: Oberflächen, Zustand" pointIndex={12} />
        <Item label="Innentüren: Art, Funktionalität" pointIndex={13} />
        <Item label="Lager- und Sozialräume: Zustand, Eignung" pointIndex={14} />

        <Text style={styles.h3}>D. Technische Ausstattung</Text>
        <Item label="Beleuchtung: Art, Helligkeit, Funktion" pointIndex={15} />
        <Item label="Heizung, Lüftung, Klima (HLK): Zustand, Effizienz" pointIndex={16} />
        <Item label="Sanitäranlagen: Anzahl, Zustand" pointIndex={17} />
        <Item label="Elektrik: Sicherungskästen, Verkabelung, Normen" pointIndex={18} />
        <Item label="Aufzüge/Rolltreppen (falls vorhanden): Funktionalität" pointIndex={19} />
        <Item label="Sicherheitssysteme: Brand, Einbruch, Fluchtwege" pointIndex={20} />
        <Item label="Internet-/Telefonanschlüsse: vorhanden, funktionsfähig" pointIndex={21} />

        <Text style={styles.h3}>E. Nachhaltigkeit (ESG-Aspekte)</Text>
        <Item label="Energieeffizienz: Dämmung, moderne HLK" pointIndex={22} />
        <Item label="PV Anlagen: Installation, Kapazität, Wartungsstatus" pointIndex={23} />
        <Item label="Elektroladesäulen: Anzahl, Leistung, Zugänglichkeit" pointIndex={24} />
        <Item label="Wassereffizienz: moderne Sanitäranlagen, Regenwassernutzung" pointIndex={25} />
        <Item label="Abfallmanagement: Trennung, Entsorgungssysteme" pointIndex={26} />
        <Item label="Barrierefreiheit: Zugänglichkeit für alle Nutzergruppen" pointIndex={27} />
        <Item label="Mieter-Engagement: Initiativen für nachhaltigen Betrieb" pointIndex={28} />

        {/* 2. Wesentliche Bauliche Mängel */}
        <Text style={styles.h2}>2. Wesentliche Bauliche Mängel</Text>
        <Item label="Risse (tragend / nichttragend)" pointIndex={29} />
        <Item label="Feuchtigkeitsschäden (Schimmel, Geruch, Flecken)" pointIndex={30} />
        <Item label="Statische Probleme (Setzungen, Verformungen)" pointIndex={31} />
        <Item label="Veraltete Installationen (Elektro, Heizung, Sanitär)" pointIndex={32} />
        <Item label="Dachschäden (Dachhaut, Entwässerung)" pointIndex={33} />
        <Item label="Brandschutzmängel (Melder, Türen, Notausgänge)" pointIndex={34} />
        <Item label="Schadstoffe (Asbest, PCB, etc., Verdachtsmomente)" pointIndex={35} />

        {/* 3. Lage & Marktsituation */}
        <Text style={styles.h2}>3. Lage & Marktsituation</Text>
        <Item label="Sichtbarkeit & Erreichbarkeit (Auto, ÖPNV, Fußgänger)" pointIndex={36} />
        <Item label="Kundenfrequenz & Passantenströme (Frequenzbringer, Einzugsgebiet)" pointIndex={37} />
        <Item label="Wettbewerbssituation (direkt, indirekt, Leerstände, Mieteniveau)" pointIndex={38} />
        <Item label="Umfeld & Synergien (Branchenmix, geplante Entwicklungen)" pointIndex={39} />
        <Item label="Baurechtliche Situation (Bebauungsplan, Nutzungsmöglichkeiten)" pointIndex={40} />

        <Text
          style={[styles.small, { position: "absolute", bottom: 18, left: 0, right: 0 }]}
          render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
