# ⚽ SoccerViz - Visualisation de Données Football

Une application web complète pour visualiser et analyser des données de football dans le cadre d'un projet académique. SoccerViz met en valeur la visualisation de données à travers trois pôles principaux, chacun accessible via une page dédiée.

## 🎯 Objectif du Projet

Projet académique visant à mettre en valeur la visualisation de données à travers l'analyse de statistiques de football, de logos de clubs et de textes/articles.

## 🏗️ Architecture

```
footbal-viz/
├── run.py                  # Point d'entrée de l'application
├── app/                    # Backend Flask
│   ├── __init__.py
│   ├── config.py          # Configuration
│   ├── routes/            # API endpoints
│   │   ├── csv_routes.py
│   │   ├── image_routes.py
│   │   └── text_routes.py
│   ├── services/          # Logique métier
│   │   ├── csv_service.py
│   │   ├── image_service.py
│   │   └── text_service.py
│   └── utils/             # Utilitaires
│       ├── file_utils.py
│       └── stats_utils.py
├── data/                  # Données locales
│   ├── player_stats.csv   # Statistiques des joueurs
│   └── texts/             # Fichiers PDF et texte à analyser
├── static/                # Frontend (CSS, JS, assets)
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── csv_ui.js      # Visualisations CSV avec Chart.js
│   │   ├── image_ui.js    # Visualisations d'images
│   │   └── text_ui.js     # Visualisations de texte
│   └── assets/
│       └── images_clubs/  # Logos des clubs
├── templates/
│   └── index.html
├── scripts/
│   └── download_club_logos.py
├── requirements.txt
└── README.md
```

## 🚀 Installation

1. Naviguer dans le dossier du projet:
```bash
cd footbal-viz
```

2. Créer un environnement virtuel:
```bash
python -m venv venv
```

3. Activer l'environnement virtuel:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Installer les dépendances:
```bash
pip install -r requirements.txt
```

## ▶️ Lancement

```bash
python run.py
```

L'application sera accessible sur `http://localhost:5000`

## 🌐 Structure des Pages

L'application SoccerViz est organisée en 4 pages principales :

1. **Page d'Accueil** (`/`) : Présentation du projet et navigation vers les différents pôles
2. **Visualisation CSV** (`/csv`) : Analyse des statistiques des joueurs
3. **Visualisation Images** (`/images`) : Exploration des logos de clubs
4. **Visualisation Texte** (`/text`) : Analyse de documents PDF et texte

## 📊 Fonctionnalités

### 1. 📈 Pôle CSV - Statistiques des Joueurs (Page `/csv`)

- **Normalisation des données** : Traitement automatique des données CSV avec gestion des valeurs manquantes et conversion des types
- **Sélection de colonnes** : Interface pour choisir une colonne à visualiser
- **Détection automatique des types de graphiques** : Le système propose automatiquement les types de graphiques adaptés selon le type de données (numérique ou catégoriel)
- **Visualisations dynamiques** avec Chart.js :
  - Graphiques en barres
  - Graphiques linéaires
  - Histogrammes
  - Box plots
  - Graphiques en secteurs (pie/donut)
  - Nuages de points
- **Carte des nationalités** : Visualisation des joueurs par nationalité avec graphique en barres
- **Statistiques globales** : Affichage des métadonnées du dataset (nombre de lignes, colonnes, valeurs manquantes)

### 2. 🖼️ Pôle Images - Logos des Clubs (Page `/images`)

- **Affichage dynamique** : Galerie interactive des logos de clubs
- **Statistiques d'images** :
  - Dimensions (largeur, hauteur)
  - Tailles de fichiers
  - Formats d'images
  - Ratios d'aspect
- **Visualisations** :
  - Distribution des largeurs
  - Distribution des hauteurs
  - Distribution des tailles
  - Répartition des formats (graphique en secteurs)

### 3. 📄 Pôle Texte - Analyse de Documents (Page `/text`)

- **Extraction de texte** :
  - Support des fichiers PDF (avec pdfplumber et PyPDF2)
  - Support des fichiers texte (.txt)
- **Analyse de récurrences** :
  - Calcul des fréquences de mots
  - Filtrage des mots vides (stop words)
  - Top N mots les plus fréquents
- **Nuage de mots** : Génération dynamique d'un nuage de mots avec Canvas
- **Statistiques textuelles** :
  - Nombre de caractères
  - Nombre de mots
  - Nombre de phrases
  - Nombre de mots uniques
- **Visualisations** :
  - Graphique en barres horizontal des mots les plus fréquents
  - Nuage de mots interactif

## 🛠️ Technologies et Bibliothèques

### Backend (Python)
- **Flask** : Framework web léger et flexible
- **pandas** : Manipulation et analyse de données
- **numpy** : Calculs numériques
- **Pillow (PIL)** : Traitement d'images
- **pdfplumber** : Extraction de texte depuis PDF
- **PyPDF2** : Alternative pour l'extraction PDF
- **wordcloud** : Génération de nuages de mots
- **scikit-learn** : Outils d'analyse de données
- **matplotlib** : Visualisation de données (backend)
- **seaborn** : Visualisation statistique avancée

### Frontend (JavaScript)
- **Chart.js** : Bibliothèque open-source pour créer des graphiques interactifs et responsives
  - Site: https://www.chartjs.org/
  - Licence: MIT
- **Vega.js / Vega-Lite** : Grammaire de visualisation déclarative
  - Site: https://vega.github.io/vega/
  - Licence: BSD-3-Clause
- **Vanilla JavaScript** : Pas de framework lourd, code JavaScript natif

### Open Source
Toutes les bibliothèques utilisées sont open source :
- **Chart.js** : MIT License
- **Vega.js** : BSD-3-Clause License
- **Flask** : BSD License
- **pandas** : BSD License
- **matplotlib** : PSF-based License

## 📋 Structure des Données

### CSV des Joueurs
Le fichier `data/player_stats.csv` doit contenir les colonnes suivantes (exemple) :
- Player name
- Nation
- Position
- Squad
- Compition
- Age
- Match played
- Goal
- Assist
- ... (autres statistiques)

### Dossier des Logos
Les logos doivent être placés dans `static/assets/images_clubs/` avec les formats supportés : PNG, JPG, JPEG, WEBP

### Dossier des Textes
Les fichiers PDF et texte doivent être placés dans `data/texts/`

## 🔧 Configuration

Voir `app/config.py` pour les paramètres de configuration :
- Formats de fichiers autorisés
- Taille maximale des fichiers
- Dossiers de données

## 🎨 Personnalisation

Les styles CSS peuvent être modifiés dans `static/css/style.css` pour adapter l'apparence de l'application.

## 📝 Notes

- L'application est conçue pour un usage académique et éducatif
- Les visualisations sont optimisées pour la lisibilité et l'interactivité
- Le code est modulaire et facilement extensible

## 📄 Licence

MIT - Projet académique

## 👥 Auteur

Projet réalisé dans le cadre d'un projet académique M2.
