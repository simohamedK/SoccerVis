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
    
    # Convertir les colonnes numériques (gérer les virgules comme séparateurs décimaux)
    numeric_columns = df_normalized.select_dtypes(include=[object]).columns
    for col in numeric_columns:
        if col not in ['Player name', 'Nation', 'Position', 'Squad', 'Compition']:
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
    """Récupère les données pour la carte des nationalités"""
    df = load_csv()
    df_normalized = normalize_data(df)
    
    if 'Nation' not in df_normalized.columns:
        return {}
    
    nationality_counts = df_normalized['Nation'].value_counts().to_dict()
    
    return {
        'nationalities': list(nationality_counts.keys()),
        'counts': list(nationality_counts.values()),
        'total_players': len(df_normalized)
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
