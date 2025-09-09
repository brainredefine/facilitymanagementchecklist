// src/components/ReportPDF.jsx
"use client";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 28 },
  h1: { fontSize: 18, textAlign: "center", marginBottom: 4, fontWeight: "bold" },
  subtitle: { fontSize: 11, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  h2: { fontSize: 13, marginTop: 12, marginBottom: 6, fontWeight: "bold" },
  h3: { fontSize: 12, marginTop: 8, marginBottom: 4, fontWeight: "bold" },
  bulletWrap: { marginBottom: 6 },
  bullet: { fontSize: 10, lineHeight: 1.35 },
  indent: { marginLeft: 10 },
  meta: { fontSize: 9, color: "#444", marginTop: 2 },
  small: { fontSize: 9, color: "#666", textAlign: "center" },
  imagesRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  thumb: { width: 110, height: 80, marginRight: 6, marginBottom: 6 },
});

const S = (v) => (v === null || v === undefined ? "" : String(v));

// 🔐 Lis tes données exactement comme tu les stockes dans page.jsx : "1", "2", ..., "40"
function getPointData(data, idx) {
  const key = String(idx);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);

  const note = own(data, key) ? data[key] : undefined;
  const cmt  = own(data, `${key}_comment`) ? data[`${key}_comment`] : undefined;

  let imgs = own(data, `${key}_images`) ? data[`${key}_images`] : [];
  if (!Array.isArray(imgs)) imgs = [];
  imgs = imgs.filter(s => typeof s === "string" && s.length > 10); // évite base64 vide

  return { note, cmt, imgs };
}

const Item = ({ data, label, index }) => {
  const { note, cmt, imgs } = getPointData(data, index);
  const showMeta = !(note === undefined && !cmt);
  const showImgs = imgs.length > 0;

  return (
    <View style={styles.bulletWrap}>
      <Text style={styles.bullet}>• {S(label)}</Text>

      {showMeta ? (
        <View style={styles.indent}>
          {note !== undefined ? <Text style={styles.meta}>Note: {S(note)}</Text> : null}
          {cmt ? <Text style={styles.meta}>Kommentar: {S(cmt)}</Text> : null}
        </View>
      ) : null}

      {showImgs ? (
        <View style={[styles.imagesRow, styles.indent]}>
          {imgs.map((b64, i) => (
            <Image key={i} style={styles.thumb} src={`data:image/jpeg;base64,${b64}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
};

export default function ReportPDF({ data = {} }) {
  const assetId = S(data.asset_id) || "N/A";
  const manager = S(data.asset_manager_name) || "N/A";
  const date = S(data.date) || new Date().toISOString().split("T")[0];

  return (
    <Document title={`Pruefbericht_${assetId}_${date}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Prüfbericht – {assetId}</Text>
        <Text style={styles.subtitle}>Bewertung gemacht von {manager} • {date}</Text>

        {/* 1. Allgemeiner Zustand des Objekts */}
        <Text style={styles.h2}>1. Allgemeiner Zustand des Objekts</Text>

        <Text style={styles.h3}>A. Gebäudehülle</Text>
        <Item data={data} label="Fassade: Material und Zustand" index={1} />
        <Item data={data} label="Dach: sichtbare Schäden, Undichtigkeiten" index={2} />
        <Item data={data} label="Fenster & Außentüren: Material, Zustand, Dichtigkeit" index={3} />
        <Item data={data} label="Eingangsbereich: Gestaltung, Funktionalität, Barrierefreiheit, Sauberkeit" index={4} />

        <Text style={styles.h3}>B. Außenanlagen</Text>
        <Item data={data} label="Parkplätze und Zufahrten: Belag, Markierungen, Ordnung" index={5} />
        <Item data={data} label="Anlieferungsbereiche: Funktionalität, Zugänglichkeit" index={6} />
        <Item data={data} label="Grünanlagen / Sauberkeit / Pflegezustand: Zustand, Gestaltung, Pflege, Müll, Verschmutzungen, Ordnung, regelmäßige Instandhaltung, Gesamteindruck" index={7} />
        <Item data={data} label="Außenbeleuchtung: ausreichend, funktionsfähig" index={8} />
        <Item data={data} label="Werbepylon/Schilder: Sichtbarkeit, Pflege, Genehmigung" index={9} />

        <Text style={styles.h3}>C. Innenbereiche</Text>
        <Item data={data} label="Bodenbeläge: Art, Zustand" index={10} />
        <Item data={data} label="Wände: Oberflächen, Schäden" index={11} />
        <Item data={data} label="Decken: Oberflächen, Zustand" index={12} />
        <Item data={data} label="Innentüren: Art, Funktionalität" index={13} />
        <Item data={data} label="Lager- und Sozialräume: Zustand, Eignung" index={14} />

        <Text style={styles.h3}>D. Technische Ausstattung</Text>
        <Item data={data} label="Beleuchtung: Art, Helligkeit, Funktion" index={15} />
        <Item data={data} label="Heizung, Lüftung, Klima (HLK): Zustand, Effizienz" index={16} />
        <Item data={data} label="Sanitäranlagen: Anzahl, Zustand" index={17} />
        <Item data={data} label="Elektrik: Sicherungskästen, Verkabelung, Normen" index={18} />
        <Item data={data} label="Aufzüge/Rolltreppen (falls vorhanden): Funktionalität" index={19} />
        <Item data={data} label="Sicherheitssysteme: Brand, Einbruch, Fluchtwege" index={20} />
        <Item data={data} label="Internet-/Telefonanschlüsse: vorhanden, funktionsfähig" index={21} />

        <Text style={styles.h3}>E. Nachhaltigkeit (ESG-Aspekte)</Text>
        <Item data={data} label="Energieeffizienz: Dämmung, moderne HLK" index={22} />
        <Item data={data} label="PV Anlagen: Installation, Kapazität, Wartungsstatus" index={23} />
        <Item data={data} label="Elektroladesäulen: Anzahl, Leistung, Zugänglichkeit" index={24} />
        <Item data={data} label="Wassereffizienz: moderne Sanitäranlagen, Regenwassernutzung" index={25} />
        <Item data={data} label="Abfallmanagement: Trennung, Entsorgungssysteme" index={26} />
        <Item data={data} label="Barrierefreiheit: Zugänglichkeit für alle Nutzergruppen" index={27} />
        <Item data={data} label="Mieter-Engagement: Initiativen für nachhaltigen Betrieb" index={28} />

        {/* 2. Wesentliche Bauliche Mängel */}
        <Text style={styles.h2}>2. Wesentliche Bauliche Mängel</Text>
        <Item data={data} label="Risse (tragend / nichttragend)" index={29} />
        <Item data={data} label="Feuchtigkeitsschäden (Schimmel, Geruch, Flecken)" index={30} />
        <Item data={data} label="Statische Probleme (Setzungen, Verformungen)" index={31} />
        <Item data={data} label="Veraltete Installationen (Elektro, Heizung, Sanitär)" index={32} />
        <Item data={data} label="Dachschäden (Dachhaut, Entwässerung)" index={33} />
        <Item data={data} label="Brandschutzmängel (Melder, Türen, Notausgänge)" index={34} />
        <Item data={data} label="Schadstoffe (Asbest, PCB, etc., Verdachtsmomente)" index={35} />

        {/* 3. Lage & Marktsituation */}
        <Text style={styles.h2}>3. Lage & Marktsituation</Text>
        <Item data={data} label="Sichtbarkeit & Erreichbarkeit (Auto, ÖPNV, Fußgänger)" index={36} />
        <Item data={data} label="Kundenfrequenz & Passantenströme (Frequenzbringer, Einzugsgebiet)" index={37} />
        <Item data={data} label="Wettbewerbssituation (direkt, indirekt, Leerstände, Mieteniveau)" index={38} />
        <Item data={data} label="Umfeld & Synergien (Branchenmix, geplante Entwicklungen)" index={39} />
        <Item data={data} label="Baurechtliche Situation (Bebauungsplan, Nutzungsmöglichkeiten)" index={40} />

        <Text
          style={[styles.small, { position: "absolute", bottom: 18, left: 0, right: 0 }]}
          render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
