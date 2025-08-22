import pandas as pd
import json
from pathlib import Path

points = [
  # 1. Allgemeiner Zustand des Objekts — A. Gebäudehülle
  "Fassade: Material und Zustand",                                            # 1
  "Dach: sichtbare Schäden, Undichtigkeiten",                                 # 2
  "Fenster & Außentüren: Material, Zustand, Dichtigkeit",                     # 3
  "Eingangsbereich: Gestaltung, Funktionalität, Barrierefreiheit, Sauberkeit",# 4

  # B. Außenanlagen
  "Parkplätze und Zufahrten: Belag, Markierungen, Ordnung",                   # 5
  "Anlieferungsbereiche: Funktionalität, Zugänglichkeit",                     # 6
  "Grünanlagen / Sauberkeit / Pflegezustand: Zustand, Gestaltung, Pflege, Müll, Verschmutzungen, Ordnung, regelmäßige Instandhaltung, Gesamteindruck", # 7
  "Außenbeleuchtung: ausreichend, funktionsfähig",                            # 8
  "Werbepylon/Schilder: Sichtbarkeit, Pflege, Genehmigung",                   # 9

  # C. Innenbereiche
  "Bodenbeläge: Art, Zustand",                                                # 10
  "Wände: Oberflächen, Schäden",                                              # 11
  "Decken: Oberflächen, Zustand",                                             # 12
  "Innentüren: Art, Funktionalität",                                          # 13
  "Lager- und Sozialräume: Zustand, Eignung",                                 # 14

  # D. Technische Ausstattung
  "Beleuchtung: Art, Helligkeit, Funktion",                                   # 15
  "Heizung, Lüftung, Klima (HLK): Zustand, Effizienz",                        # 16
  "Sanitäranlagen: Anzahl, Zustand",                                          # 17
  "Elektrik: Sicherungskästen, Verkabelung, Normen",                          # 18
  "Aufzüge/Rolltreppen (falls vorhanden): Funktionalität",                    # 19
  "Sicherheitssysteme: Brand, Einbruch, Fluchtwege",                          # 20
  "Internet-/Telefonanschlüsse: vorhanden, funktionsfähig",                   # 21

  # E. Nachhaltigkeit (ESG-Aspekte)
  "Energieeffizienz: Dämmung, moderne HLK",                                   # 22
  "PV Anlagen: Installation, Kapazität, Wartungsstatus",                      # 23
  "Elektroladesäulen: Anzahl, Leistung, Zugänglichkeit",                      # 24
  "Wassereffizienz: moderne Sanitäranlagen, Regenwassernutzung",              # 25
  "Abfallmanagement: Trennung, Entsorgungssysteme",                           # 26
  "Barrierefreiheit: Zugänglichkeit für alle Nutzergruppen",                  # 27
  "Mieter-Engagement: Initiativen für nachhaltigen Betrieb",                  # 28

  # 2. Wesentliche Bauliche Mängel
  "Risse (tragend / nichttragend)",                                           # 29
  "Feuchtigkeitsschäden (Schimmel, Geruch, Flecken)",                         # 30
  "Statische Probleme (Setzungen, Verformungen)",                             # 31
  "Veraltete Installationen (Elektro, Heizung, Sanitär)",                     # 32
  "Dachschäden (Dachhaut, Entwässerung)",                                     # 33
  "Brandschutzmängel (Melder, Türen, Notausgänge)",                           # 34
  "Schadstoffe (Asbest, PCB, etc., Verdachtsmomente)",                        # 35

  # 3. Lage & Marktsituation — A. Mikrolage
  "Sichtbarkeit & Erreichbarkeit (Auto, ÖPNV, Fußgänger)",                    # 36
  "Kundenfrequenz & Passantenströme (Frequenzbringer, Einzugsgebiet)",        # 37
  "Wettbewerbssituation (direkt, indirekt, Leerstände, Mieteniveau)",         # 38
  "Umfeld & Synergien (Branchenmix, geplante Entwicklungen)",                 # 39
  "Baurechtliche Situation (Bebauungsplan, Nutzungsmöglichkeiten)"            # 40
]

mapping = [{"point_id": f"point_{i+1}", "libelle": label} for i, label in enumerate(points)]

out_path = Path(__file__).resolve().parent / "mapping_checklist_40_points.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(mapping)} points to {out_path}")
