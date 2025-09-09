// src/components/ReportPDF.jsx
"use client";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 28 },
  h1: { fontSize: 18, textAlign: "center", marginBottom: 4, fontWeight: "bold" },
  subtitle: { fontSize: 11, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  h2: { fontSize: 13, marginTop: 12, marginBottom: 6, fontWeight: "bold" },
  h3: { fontSize: 12, marginTop: 8, marginBottom: 4, fontWeight: "bold" },
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

function getPointData(data, pointIndex) {
  const keyOld = `point_${pointIndex}`;
  const keyNew = String(pointIndex);
  const note =
    data && Object.prototype.hasOwnProperty.call(data, keyOld) ? data[keyOld] :
    data && Object.prototype.hasOwnProperty.call(data, keyNew) ? data[keyNew] :
    undefined;
  const cmt =
    data && Object.prototype.hasOwnProperty.call(data, `${keyOld}_comment`) ? data[`${keyOld}_comment`] :
    data && Object.prototype.hasOwnProperty.call(data, `${keyNew}_comment`) ? data[`${keyNew}_comment`] :
    undefined;
  const imgsRaw =
    data && Object.prototype.hasOwnProperty.call(data, `${keyOld}_images`) ? data[`${keyOld}_images`] :
    data && Object.prototype.hasOwnProperty.call(data, `${keyNew}_images`) ? data[`${keyNew}_images`] :
    [];
  const imgs = Array.isArray(imgsRaw) ? imgsRaw.filter(Boolean) : [];
  return { note, cmt, imgs };
}

const AvgRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.val}>{Safe(value)}</Text>
  </View>
);

const Item = ({ data, label, pointIndex }) => {
  const { note, cmt, imgs } = getPointData(data, pointIndex);
  const hasMeta = !(note === undefined && !cmt);
  const hasImgs = imgs.length > 0;

  return (
    <View style={styles.bulletWrap}>
      <Text style={styles.bullet}>• {label}</Text>

      {hasMeta ? (
        <View style={styles.indent}>
          {note !== undefined ? <Text style={styles.meta}>Note: {String(note)}</Text> : null}
          {cmt ? <Text style={styles.meta}>Kommentar: {cmt}</Text> : null}
        </View>
      ) : null}

      {hasImgs ? (
        <View style={[styles.imagesRow, styles.indent]}>
          {imgs.map((b64, idx) => (
            <Image key={idx} style={styles.thumb} src={`data:image/jpeg;base64,${b64}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
};

export default function ReportPDF({ data = {} }) {
  const assetId = Safe(data.asset_id) || "N/A";
  const manager = Safe(data.asset_manager_name) || "N/A";
  const date = Safe(data.date) || new Date().toISOString().split("T")[0];

  return (
    <Document title={`Pruefbericht_${assetId}_${date}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Prüfbericht – {assetId}</Text>
        <Text style={styles.subtitle}>Bewertung gemacht von {manager} • {date}</Text>

        {/* Résumé des moyennes (Ø) */}
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
        <Item data={data} label="Fassade: Material und Zustand" pointIndex={1} />
        <Item data={data} label="Dach: sichtbare Schäden, Undichtigkeiten" pointIndex={2} />
        <Item data={data} label="Fenster & Außentüren: Material, Zustand, Dichtigkeit" pointIndex={3} />
        <Item data={data} label="Eingangsbereich: Gestaltung, Funktionalität, Barrierefreiheit, Sauberkeit" pointIndex={4} />

        <Text style={styles.h3}>B. Außenanlagen</Text>
        <Item data={data} label="Parkplätze und Zufahrten: Belag, Markierungen, Ordnung" pointIndex={5} />
        <Item data={data} label="Anlieferungsbereiche: Funktionalität, Zugänglichkeit" pointIndex={6} />
        <Item data={data} label="Grünanlagen / Sauberkeit / Pflegezustand: Zustand, Gestaltung, Pflege, Müll, Verschmutzungen, Ordnung, regelmäßige Instandhaltung, Gesamteindruck" pointIndex={7} />
        <Item data={data} label="Außenbeleuchtung: ausreichend, funktionsfähig" pointIndex={8} />
        <Item data={data} label="Werbepylon/Schilder: Sichtbarkeit, Pflege, Genehmigung" pointIndex={9} />

        <Text style={styles.h3}>C. Innenbereiche</Text>
        <Item data={data} label="Bodenbeläge: Art, Zustand" pointIndex={10} />
        <Item data={data} label="Wände: Oberflächen, Schäden" pointIndex={11} />
        <Item data={data} label="Decken: Oberflächen, Zustand" pointIndex={12} />
        <Item data={data} label="Innentüren: Art, Funktionalität" pointIndex={13} />
        <Item data={data} label="Lager- und Sozialräume: Zustand, Eignung" pointIndex={14} />

        <Text style={styles.h3}>D. Technische Ausstattung</Text>
        <Item data={data} label="Beleuchtung: Art, Helligkeit, Funktion" pointIndex={15} />
        <Item data={data} label="Heizung, Lüftung, Klima (HLK): Zustand, Effizienz" pointIndex={16} />
        <Item data={data} label="Sanitäranlagen: Anzahl, Zustand" pointIndex={17} />
        <Item data={data} label="Elektrik: Sicherungskästen, Verkabelung, Normen" pointIndex={18} />
        <Item data={data} label="Aufzüge/Rolltreppen (falls vorhanden): Funktionalität" pointIndex={19} />
        <Item data={data} label="Sicherheitssysteme: Brand, Einbruch, Fluchtwege" pointIndex={20} />
        <Item data={data} label="Internet-/Telefonanschlüsse: vorhanden, funktionsfähig" pointIndex={21} />

        <Text style={styles.h3}>E. Nachhaltigkeit (ESG-Aspekte)</Text>
        <Item data={data} label="Energieeffizienz: Dämmung, moderne HLK" pointIndex={22} />
        <Item data={data} label="PV Anlagen: Installation, Kapazität, Wartungsstatus" pointIndex={23} />
        <Item data={data} label="Elektroladesäulen: Anzahl, Leistung, Zugänglichkeit" pointIndex={24} />
        <Item data={data} label="Wassereffizienz: moderne Sanitäranlagen, Regenwassernutzung" pointIndex={25} />
        <Item data={data} label="Abfallmanagement: Trennung, Entsorgungssysteme" pointIndex={26} />
        <Item data={data} label="Barrierefreiheit: Zugänglichkeit für alle Nutzergruppen" pointIndex={27} />
        <Item data={data} label="Mieter-Engagement: Initiativen für nachhaltigen Betrieb" pointIndex={28} />

        {/* 2. Wesentliche Bauliche Mängel */}
        <Text style={styles.h2}>2. Wesentliche Bauliche Mängel</Text>
        <Item data={data} label="Risse (tragend / nichttragend)" pointIndex={29} />
        <Item data={data} label="Feuchtigkeitsschäden (Schimmel, Geruch, Flecken)" pointIndex={30} />
        <Item data={data} label="Statische Probleme (Setzungen, Verformungen)" pointIndex={31} />
        <Item data={data} label="Veraltete Installationen (Elektro, Heizung, Sanitär)" pointIndex={32} />
        <Item data={data} label="Dachschäden (Dachhaut, Entwässerung)" pointIndex={33} />
        <Item data={data} label="Brandschutzmängel (Melder, Türen, Notausgänge)" pointIndex={34} />
        <Item data={data} label="Schadstoffe (Asbest, PCB, etc., Verdachtsmomente)" pointIndex={35} />

        {/* 3. Lage & Marktsituation */}
        <Text style={styles.h2}>3. Lage & Marktsituation</Text>
        <Item data={data} label="Sichtbarkeit & Erreichbarkeit (Auto, ÖPNV, Fußgänger)" pointIndex={36} />
        <Item data={data} label="Kundenfrequenz & Passantenströme (Frequenzbringer, Einzugsgebiet)" pointIndex={37} />
        <Item data={data} label="Wettbewerbssituation (direkt, indirekt, Leerstände, Mieteniveau)" pointIndex={38} />
        <Item data={data} label="Umfeld & Synergien (Branchenmix, geplante Entwicklungen)" pointIndex={39} />
        <Item data={data} label="Baurechtliche Situation (Bebauungsplan, Nutzungsmöglichkeiten)" pointIndex={40} />

        <Text
          style={[styles.small, { position: "absolute", bottom: 18, left: 0, right: 0 }]}
          render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
