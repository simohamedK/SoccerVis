import pandas as pd
import os
import numpy as np
from app.utils import stats_utils

# Chemin relatif depuis la racine du projet
def get_csv_path():
    """Retourne le chemin du fichier CSV"""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    return os.path.join(base_dir, 'data', 'player_stats.csv')

CSV_FILE = get_csv_path()

def load_csv(filename=None):
    """Charge le fichier CSV"""
    if filename is None:
        filename = CSV_FILE
    
    if not os.path.exists(filename):
        raise FileNotFoundError(f"Fichier {filename} non trouvé")
    
    # Charger avec gestion des erreurs d'encodage
    try:
        df = pd.read_csv(filename, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(filename, encoding='latin-1')
    
    return df

def normalize_data(df):
    """Normalise les données du CSV"""
    df_normalized = df.copy()
    
    # Nettoyer les noms de colonnes (supprimer espaces)
    df_normalized.columns = df_normalized.columns.str.strip()
    
    # Normaliser spécifiquement la colonne "age" si elle existe
    if 'age' in df_normalized.columns or 'Age' in df_normalized.columns:
        age_col = 'age' if 'age' in df_normalized.columns else 'Age'
        # Extraire seulement la première valeur (avant le tiret si présent)
        df_normalized[age_col] = df_normalized[age_col].astype(str).str.split('-').str[0].str.split('/').str[0]
        # Convertir en float
        df_normalized[age_col] = pd.to_numeric(df_normalized[age_col], errors='coerce')
    
    # Convertir les colonnes numériques (gérer les virgules comme séparateurs décimaux)
    numeric_columns = df_normalized.select_dtypes(include=[object]).columns
    for col in numeric_columns:
        if col not in ['Player name', 'Nation', 'Position', 'Squad', 'Compition', 'age', 'Age']:
            try:
                # Remplacer les virgules par des points pour les nombres
                df_normalized[col] = df_normalized[col].astype(str).str.replace(',', '.')
                df_normalized[col] = pd.to_numeric(df_normalized[col], errors='coerce')
            except:
                pass
    
    # Remplacer les valeurs manquantes par 0 pour les colonnes numériques
    numeric_cols = df_normalized.select_dtypes(include=[np.number]).columns
    df_normalized[numeric_cols] = df_normalized[numeric_cols].fillna(0)
    
    return df_normalized

def get_csv_data():
    """Récupère les données normalisées du CSV"""
    df = load_csv()
    df_normalized = normalize_data(df)
    return df_normalized.to_dict(orient='records')

def get_columns_info():
    """Récupère les informations sur les colonnes"""
    df = load_csv()
    df_normalized = normalize_data(df)
    
    columns_info = []
    for col in df_normalized.columns:
        col_info = {
            'name': col,
            'type': str(df_normalized[col].dtype),
            'is_numeric': pd.api.types.is_numeric_dtype(df_normalized[col]),
            'unique_count': df_normalized[col].nunique(),
            'null_count': int(df_normalized[col].isnull().sum())
        }
        
        if col_info['is_numeric']:
            col_info['min'] = float(df_normalized[col].min())
            col_info['max'] = float(df_normalized[col].max())
            col_info['mean'] = float(df_normalized[col].mean())
            col_info['std'] = float(df_normalized[col].std())
        
        columns_info.append(col_info)
    
    return columns_info

def get_available_chart_types(column_name):
    """Détermine les types de graphiques disponibles pour une colonne"""
    df = load_csv()
    df_normalized = normalize_data(df)
    
    if column_name not in df_normalized.columns:
        return []
    
    col = df_normalized[column_name]
    chart_types = []
    
    if pd.api.types.is_numeric_dtype(col):
        chart_types.extend(['bar', 'line', 'histogram', 'box', 'scatter'])
    else:
        chart_types.extend(['bar', 'pie', 'donut'])
    
    return chart_types

def get_column_data(column_name, limit=100):
    """Récupère les données d'une colonne pour visualisation"""
    df = load_csv()
    df_normalized = normalize_data(df)
    
    if column_name not in df_normalized.columns:
        raise ValueError(f"Colonne {column_name} non trouvée")
    
    col = df_normalized[column_name]
    
    if pd.api.types.is_numeric_dtype(col):
        # Pour les colonnes numériques, retourner les valeurs
        data = col.dropna().head(limit).tolist()
        return {'type': 'numeric', 'data': data, 'labels': list(range(len(data)))}
    else:
        # Pour les colonnes catégorielles, compter les occurrences
        value_counts = col.value_counts().head(limit)
        return {
            'type': 'categorical',
            'data': value_counts.values.tolist(),
            'labels': value_counts.index.tolist()
        }

def get_multiple_columns_data(columns, limit=100):
    """Récupère les données de plusieurs colonnes pour visualisation multi-colonnes"""
    df = load_csv()
    df_normalized = normalize_data(df)
    
    result = {}
    for col_name in columns:
        if col_name not in df_normalized.columns:
            continue
        
        col = df_normalized[col_name]
        if pd.api.types.is_numeric_dtype(col):
            data = col.dropna().head(limit).tolist()
            result[col_name] = {
                'type': 'numeric',
                'data': data,
                'labels': list(range(len(data)))
            }
        else:
            value_counts = col.value_counts().head(limit)
            result[col_name] = {
                'type': 'categorical',
                'data': value_counts.values.tolist(),
                'labels': value_counts.index.tolist()
            }
    
    return result

def get_nationality_map_data():
    """Récupère les données pour la carte des nationalités avec coordonnées géographiques"""
    df = load_csv()
    df_normalized = normalize_data(df)
    
    if 'Nation' not in df_normalized.columns:
        return {}
    
    # Mapping des pays vers leurs coordonnées (latitude, longitude)
    # Coordonnées approximatives des capitales des pays
    country_coordinates = {
        'France': [46.2276, 2.2137],
        'Brazil': [-14.2350, -51.9253],
        'Argentina': [-38.4161, -63.6167],
        'Spain': [40.4637, -3.7492],
        'Germany': [51.1657, 10.4515],
        'Italy': [41.8719, 12.5674],
        'Portugal': [39.3999, -8.2245],
        'England': [52.3555, -1.1743],
        'Netherlands': [52.1326, 5.2913],
        'Belgium': [50.5039, 4.4699],
        'Croatia': [45.1000, 15.2000],
        'Senegal': [14.4974, -14.4524],
        'Morocco': [31.7917, -7.0926],
        'Algeria': [28.0339, 1.6596],
        'Tunisia': [33.8869, 9.5375],
        'Cameroon': [7.3697, 12.3547],
        'Ivory Coast': [7.5400, -5.5471],
        'Ghana': [7.9465, -1.0232],
        'Nigeria': [9.0820, 8.6753],
        'Egypt': [26.0975, 30.0444],
        'South Africa': [-30.5595, 22.9375],
        'Mali': [17.5707, -3.9962],
        'Burkina Faso': [12.2383, -1.5616],
        'Guinea': [9.9456, -9.6966],
        'Congo': [-4.0383, 21.7587],
        'DR Congo': [-4.0383, 21.7587],
        'Angola': [-11.2027, 17.8739],
        'Gabon': [-0.8037, 11.6094],
        'Togo': [8.6195, 0.8248],
        'Benin': [9.3077, 2.3158],
        'United States': [37.0902, -95.7129],
        'Mexico': [23.6345, -102.5528],
        'Canada': [56.1304, -106.3468],
        'Colombia': [4.5709, -74.2973],
        'Chile': [-35.6751, -71.5430],
        'Uruguay': [-32.5228, -55.7658],
        'Paraguay': [-23.4425, -58.4438],
        'Peru': [-9.1900, -75.0152],
        'Ecuador': [-1.8312, -78.1834],
        'Venezuela': [6.4238, -66.5897],
        'Bolivia': [-16.2902, -63.5887],
        'Japan': [36.2048, 138.2529],
        'South Korea': [35.9078, 127.7669],
        'China': [35.8617, 104.1954],
        'Australia': [-25.2744, 133.7751],
        'New Zealand': [-40.9006, 174.8860],
        'India': [20.5937, 78.9629],
        'Thailand': [15.8700, 100.9925],
        'Indonesia': [-0.7893, 113.9213],
        'Philippines': [12.8797, 121.7740],
        'Saudi Arabia': [23.8859, 45.0792],
        'Iran': [32.4279, 53.6880],
        'Iraq': [33.2232, 43.6793],
        'Turkey': [38.9637, 35.2433],
        'Russia': [61.5240, 105.3188],
        'Ukraine': [48.3794, 31.1656],
        'Poland': [51.9194, 19.1451],
        'Czech Republic': [49.8175, 15.4730],
        'Slovakia': [48.6690, 19.6990],
        'Hungary': [47.1625, 19.5033],
        'Romania': [45.9432, 24.9668],
        'Bulgaria': [42.7339, 25.4858],
        'Serbia': [44.0165, 21.0059],
        'Bosnia': [43.9159, 17.6791],
        'Greece': [39.0742, 21.8243],
        'Sweden': [60.1282, 18.6435],
        'Norway': [60.4720, 8.4689],
        'Denmark': [56.2639, 9.5018],
        'Finland': [61.9241, 25.7482],
        'Iceland': [64.9631, -19.0208],
        'Ireland': [53.4129, -8.2439],
        'Scotland': [56.4907, -4.2026],
        'Wales': [52.1307, -3.7837],
        'Switzerland': [46.8182, 8.2275],
        'Austria': [47.5162, 14.5501],
        'Israel': [31.0461, 34.8516],
        'Lebanon': [33.8547, 35.8623],
        'Jordan': [30.5852, 36.2384],
        'Qatar': [25.3548, 51.1839],
        'UAE': [23.4241, 53.8478],
        'Kuwait': [29.3117, 47.4818],
        'Oman': [21.4735, 55.9754],
        'Yemen': [15.5527, 48.5164],
        'Syria': [34.8021, 38.9968],
        'Palestine': [31.9522, 35.2332],
    }
    
    nationality_counts = df_normalized['Nation'].value_counts().to_dict()
    
    # Préparer les données avec coordonnées
    map_points = []
    for nation, count in nationality_counts.items():
        # Nettoyer le nom du pays (supprimer espaces, normaliser)
        nation_clean = nation.strip() if isinstance(nation, str) else str(nation)
        
        # Chercher les coordonnées (essayer plusieurs variantes)
        coords = None
        if nation_clean in country_coordinates:
            coords = country_coordinates[nation_clean]
        else:
            # Essayer de trouver une correspondance partielle
            for country, coord in country_coordinates.items():
                if country.lower() in nation_clean.lower() or nation_clean.lower() in country.lower():
                    coords = coord
                    break
        
        # Si pas de coordonnées trouvées, utiliser des coordonnées par défaut (centre du monde)
        if coords is None:
            # Coordonnées par défaut (centre de l'Afrique)
            coords = [10.0, 10.0]
        
        map_points.append({
            'nation': nation_clean,
            'count': int(count),
            'lat': coords[0],
            'lng': coords[1]
        })
    
    return {
        'points': map_points,
        'total_players': len(df_normalized),
        'total_nations': len(map_points)
    }

def get_stats():
    """Calcule les statistiques détaillées du CSV"""
    df = load_csv()
    df_normalized = normalize_data(df)
    
    base_stats = stats_utils.calculate_stats(df_normalized)
    
    # Statistiques détaillées
    numeric_cols = df_normalized.select_dtypes(include=[np.number]).columns
    categorical_cols = df_normalized.select_dtypes(include=[object]).columns
    
    detailed_stats = {
        'file_info': {
            'filename': os.path.basename(CSV_FILE),
            'file_size_bytes': os.path.getsize(CSV_FILE) if os.path.exists(CSV_FILE) else 0,
            'file_size_mb': round(os.path.getsize(CSV_FILE) / (1024 * 1024), 2) if os.path.exists(CSV_FILE) else 0
        },
        'dataset_info': {
            'total_rows': len(df_normalized),
            'total_columns': len(df_normalized.columns),
            'numeric_columns_count': len(numeric_cols),
            'categorical_columns_count': len(categorical_cols),
            'total_cells': len(df_normalized) * len(df_normalized.columns),
            'missing_values_total': int(df_normalized.isnull().sum().sum()),
            'missing_percentage': round((df_normalized.isnull().sum().sum() / (len(df_normalized) * len(df_normalized.columns))) * 100, 2)
        },
        'column_details': base_stats.get('columns', []),
        'missing_values': base_stats.get('missing_values', {}),
        'data_types': base_stats.get('dtypes', {})
    }
    
    return detailed_stats

def get_random_visualization(chart_type=None):
    """Génère une visualisation aléatoire avec seulement des types significatifs"""
    import random
    
    df = load_csv()
    df_normalized = normalize_data(df)
    
    numeric_cols = df_normalized.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df_normalized.select_dtypes(include=[object]).columns.tolist()
    
    if not numeric_cols and not categorical_cols:
        return None
    
    # Si un type de graphique est spécifié, l'utiliser
    if chart_type:
        selected_chart_type = chart_type
        # Choisir une colonne appropriée pour ce type
        if chart_type == 'pie':
            # Pour pie, on a besoin d'une colonne catégorielle
            if categorical_cols:
                selected_col = random.choice(categorical_cols)
            else:
                return None
        elif chart_type == 'histogram':
            # Pour histogramme, on a besoin d'une colonne numérique
            if numeric_cols:
                selected_col = random.choice(numeric_cols)
            else:
                return None
        else:  # bar
            # Pour bar, on peut utiliser n'importe quelle colonne
            all_cols = numeric_cols + categorical_cols
            selected_col = random.choice(all_cols)
    else:
        # Choisir aléatoirement une colonne
        all_cols = numeric_cols + categorical_cols
        selected_col = random.choice(all_cols)
        
        # Choisir aléatoirement un type de graphique significatif seulement
        if selected_col in numeric_cols:
            chart_types = ['bar', 'histogram']  # Seulement bar et histogramme
        else:
            chart_types = ['bar', 'pie']  # Seulement bar et pie
        
        selected_chart_type = random.choice(chart_types)
    
    return {
        'column': selected_col,
        'chart_type': selected_chart_type
    }
