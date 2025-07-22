import pandas as pd

# Définir les 25 points comme demandé
points = [
    "Fassade: Material und Zustand",
    "Dach: Sichtbare Schäden",
    "Fenster & Türen (Außen): Material und Zustand",
    "Außenanlagen & Grundstück: Parkplätze und Zufahrten",
    "Außenanlagen & Grundstück: Anlieferungsbereiche",
    "Außenanlagen & Grundstück: Allgemeine Sauberkeit und Pflegezustand",
    "Außenanlagen & Grundstück: Beleuchtung Außenbereich",
    "Außenanlagen & Grundstück: Werbepylon/Schilder",
    "Bodenbeläge: Art und Zustand",
    "Wände: Oberflächen und Zustand",
    "Decken: Oberflächen und Zustand",
    "Beleuchtung: Art, Helligkeit, Funktion",
    "Heizung, Lüftung, Klima (HLK): Zustand und Funktionalität",
    "Sanitäranlagen: Anzahl und Zustand",
    "Elektrik: Zustand der Installationen (Sicherungskästen, Verkabelung)",
    "Türen (Innen): Art, Zustand, Funktion",
    "Sonstige Ausstattung: Aufzüge/Rolltreppen (falls vorhanden)",
    "Sonstige Ausstattung: Sicherheitssysteme (Brand, Einbruch)",
    "Sonstige Ausstattung: Internet-/Telefonanschluss",
    "Sonstige Ausstattung: Lager- und Sozialräume",
    "Energieeffizienz: Hinweise auf Dämmung, moderne HLK, erneuerbare Energien (PV)",
    "Wassereffizienz: Moderne Sanitäranlagen, Regenwassernutzung",
    "Abfallmanagement: Trennsysteme, Entsorgungsmöglichkeiten",
    "Barrierefreiheit: Zugänglichkeit für alle Nutzergruppen",
    "Mieter-Engagement: Initiativen für nachhaltigen Betrieb"
]

# Créer le DataFrame
df_mapping = pd.DataFrame({
    "point_id": [f"point_{i+1}" for i in range(len(points))],
    "libelle": points
})

import ace_tools as tools; tools.display_dataframe_to_user(name="Mapping des points d'évaluation", dataframe=df_mapping)

# Convertir le DataFrame en JSON formaté pour usage dans n8n
json_output = df_mapping.to_dict(orient="records")

# Sauvegarder en fichier JSON
json_path = "/mnt/data/mapping_checklist_25_points.json"
with open(json_path, "w", encoding="utf-8") as f:
    import json
    json.dump(json_output, f, indent=2, ensure_ascii=False)

json_path
Résultat
'/mnt/data/mapping_checklist_25_points.json'