import os
from PIL import Image
import numpy as np
from collections import Counter
from app.utils import file_utils
try:
    from sklearn.cluster import KMeans
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not available, k-means clustering disabled")

# Chemin relatif depuis la racine du projet
def get_logos_dir():
    """Retourne le chemin du dossier des logos"""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    return os.path.join(base_dir, 'static', 'assets', 'images_clubs')

LOGOS_DIR = get_logos_dir()

def get_logos_list():
    """Retourne la liste des logos disponibles avec leurs métadonnées"""
    logos_dir = get_logos_dir()
    if not os.path.exists(logos_dir):
        return []
    
    logos = []
    for filename in os.listdir(logos_dir):
        if file_utils.allowed_image_file(filename):
            filepath = os.path.join(logos_dir, filename)
            try:
                with Image.open(filepath) as img:
                    width, height = img.size
                    format_type = img.format
                    mode = img.mode
                    file_size = os.path.getsize(filepath)
                    
                    logos.append({
                        'name': filename,
                        'path': f'/static/assets/images_clubs/{filename}',
                        'width': width,
                        'height': height,
                        'format': format_type,
                        'mode': mode,
                        'size_bytes': file_size,
                        'size_kb': round(file_size / 1024, 2),
                        'aspect_ratio': round(width / height, 2) if height > 0 else 0
                    })
            except Exception as e:
                # Si l'image ne peut pas être lue, ajouter quand même les infos de base
                logos.append({
                    'name': filename,
                    'path': f'/static/assets/images_clubs/{filename}',
                    'error': str(e)
                })
    
    return logos

def get_image_stats():
    """Calcule les statistiques globales des images"""
    logos = get_logos_list()
    
    if not logos:
        return {}
    
    # Filtrer les logos sans erreur
    valid_logos = [logo for logo in logos if 'error' not in logo]
    
    if not valid_logos:
        return {'total': len(logos), 'valid': 0}
    
    widths = [logo['width'] for logo in valid_logos]
    heights = [logo['height'] for logo in valid_logos]
    sizes = [logo['size_kb'] for logo in valid_logos]
    formats = [logo['format'] for logo in valid_logos]
    aspect_ratios = [logo['aspect_ratio'] for logo in valid_logos]
    
    format_counts = {}
    for fmt in formats:
        format_counts[fmt] = format_counts.get(fmt, 0) + 1
    
    return {
        'total': len(logos),
        'valid': len(valid_logos),
        'width': {
            'min': min(widths),
            'max': max(widths),
            'mean': round(np.mean(widths), 2),
            'median': round(np.median(widths), 2)
        },
        'height': {
            'min': min(heights),
            'max': max(heights),
            'mean': round(np.mean(heights), 2),
            'median': round(np.median(heights), 2)
        },
        'size_kb': {
            'min': min(sizes),
            'max': max(sizes),
            'mean': round(np.mean(sizes), 2),
            'median': round(np.median(sizes), 2),
            'total': round(sum(sizes), 2)
        },
        'aspect_ratio': {
            'min': min(aspect_ratios),
            'max': max(aspect_ratios),
            'mean': round(np.mean(aspect_ratios), 2),
            'median': round(np.median(aspect_ratios), 2)
        },
        'formats': format_counts
    }

def analyze_image_colors(filename, use_kmeans=True):
    """Analyse les couleurs dominantes d'une image avec k-means ou méthode fréquentielle"""
    logos_dir = get_logos_dir()
    filepath = os.path.join(logos_dir, filename)
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Image {filename} non trouvée")
    
    try:
        with Image.open(filepath) as img:
            # Convertir en RGB si nécessaire
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Redimensionner pour accélérer l'analyse
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Convertir en numpy array
            img_array = np.array(img)
            pixels = img_array.reshape(-1, 3)
            
            if len(pixels) == 0:
                raise ValueError("Image vide ou invalide")
            
            colors = []
            
            # Utiliser k-means si disponible, sinon méthode fréquentielle
            if use_kmeans and SKLEARN_AVAILABLE:
                # K-means clustering pour trouver les couleurs dominantes
                n_clusters = min(5, len(pixels))
                kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                kmeans.fit(pixels)
                
                # Obtenir les centres de clusters (couleurs dominantes)
                cluster_centers = kmeans.cluster_centers_
                labels = kmeans.labels_
                
                # Calculer le pourcentage de chaque cluster
                unique_labels, counts = np.unique(labels, return_counts=True)
                
                for i, (label, count) in enumerate(zip(unique_labels, counts)):
                    center = cluster_centers[label]
                    r, g, b = int(center[0]), int(center[1]), int(center[2])
                    r = max(0, min(255, r))
                    g = max(0, min(255, g))
                    b = max(0, min(255, b))
                    
                    colors.append({
                        'rgb': [r, g, b],
                        'hex': '#{:02x}{:02x}{:02x}'.format(r, g, b),
                        'frequency': int(count),
                        'percentage': round((count / len(pixels)) * 100, 2)
                    })
                
                # Trier par pourcentage décroissant
                colors.sort(key=lambda x: x['percentage'], reverse=True)
            else:
                # Méthode fréquentielle (fallback)
                quantized = (pixels // 32) * 32
                color_counts = Counter(map(tuple, quantized))
                top_colors = color_counts.most_common(5)
                
                for color, count in top_colors:
                    r = int(color[0]) if not isinstance(color[0], str) else int(color[0])
                    g = int(color[1]) if not isinstance(color[1], str) else int(color[1])
                    b = int(color[2]) if not isinstance(color[2], str) else int(color[2])
                    
                    r = max(0, min(255, r))
                    g = max(0, min(255, g))
                    b = max(0, min(255, b))
                    
                    colors.append({
                        'rgb': [r, g, b],
                        'hex': '#{:02x}{:02x}{:02x}'.format(r, g, b),
                        'frequency': int(count),
                        'percentage': round((count / len(pixels)) * 100, 2)
                    })
            
            return {
                'filename': filename,
                'colors': colors,
                'total_pixels': len(pixels),
                'method': 'kmeans' if (use_kmeans and SKLEARN_AVAILABLE) else 'frequency'
            }
    except Exception as e:
        raise Exception(f"Erreur lors de l'analyse des couleurs: {str(e)}")

def get_image_histograms(filename):
    """Calcule les histogrammes RGB et HSV d'une image"""
    logos_dir = get_logos_dir()
    filepath = os.path.join(logos_dir, filename)
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Image {filename} non trouvée")
    
    try:
        with Image.open(filepath) as img:
            # Convertir en RGB
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img_array = np.array(img)
            
            # Histogramme RGB
            r_hist = np.histogram(img_array[:, :, 0].flatten(), bins=256, range=(0, 256))[0]
            g_hist = np.histogram(img_array[:, :, 1].flatten(), bins=256, range=(0, 256))[0]
            b_hist = np.histogram(img_array[:, :, 2].flatten(), bins=256, range=(0, 256))[0]
            
            # Convertir en HSV en utilisant PIL (plus rapide)
            hsv_img = img.convert('HSV')
            hsv_array = np.array(hsv_img)
            
            # Convertir les valeurs HSV
            # H: 0-255 -> 0-360, S: 0-255 -> 0-100, V: 0-255 -> 0-100
            hsv_normalized = np.zeros_like(hsv_array, dtype=float)
            hsv_normalized[:, :, 0] = (hsv_array[:, :, 0] / 255.0) * 360  # H
            hsv_normalized[:, :, 1] = (hsv_array[:, :, 1] / 255.0) * 100   # S
            hsv_normalized[:, :, 2] = (hsv_array[:, :, 2] / 255.0) * 100   # V
            
            # Histogramme HSV (utiliser les valeurs normalisées)
            h_hist = np.histogram(hsv_normalized[:, :, 0].flatten(), bins=360, range=(0, 360))[0]
            s_hist = np.histogram(hsv_normalized[:, :, 1].flatten(), bins=100, range=(0, 100))[0]
            v_hist = np.histogram(hsv_normalized[:, :, 2].flatten(), bins=100, range=(0, 100))[0]
            
            return {
                'rgb': {
                    'r': r_hist.tolist(),
                    'g': g_hist.tolist(),
                    'b': b_hist.tolist()
                },
                'hsv': {
                    'h': h_hist.tolist(),
                    's': s_hist.tolist(),
                    'v': v_hist.tolist()
                }
            }
    except Exception as e:
        raise Exception(f"Erreur lors du calcul des histogrammes: {str(e)}")

def get_clubs_comparison(limit=10):
    """Récupère les couleurs dominantes de plusieurs clubs pour comparaison"""
    logos = get_logos_list()
    valid_logos = [logo for logo in logos if 'error' not in logo][:limit]
    
    clubs_data = []
    for logo in valid_logos:
        try:
            colors_data = analyze_image_colors(logo['name'], use_kmeans=True)
            clubs_data.append({
                'name': logo['name'].replace('.png', '').replace('.jpg', '').replace('.jpeg', ''),
                'filename': logo['name'],
                'path': logo['path'],
                'colors': colors_data.get('colors', [])[:3]  # Top 3 couleurs
            })
        except Exception as e:
            print(f"Erreur pour {logo['name']}: {e}")
            continue
    
    return clubs_data

def get_all_images_analysis():
    """Analyse globale de toutes les images combinées"""
    logos = get_logos_list()
    valid_logos = [logo for logo in logos if 'error' not in logo]
    
    if not valid_logos:
        return {
            'total_images': 0,
            'global_colors': [],
            'color_distribution': {},
            'format_distribution': {},
            'size_distribution': {}
        }
    
    # Collecter toutes les couleurs de toutes les images
    all_colors_rgb = []
    all_colors_hex = []
    format_counts = {}
    sizes = []
    
    for logo in valid_logos:
        try:
            # Analyser les couleurs
            colors_data = analyze_image_colors(logo['name'], use_kmeans=True)
            colors = colors_data.get('colors', [])
            
            for color in colors:
                all_colors_rgb.append(color['rgb'])
                all_colors_hex.append(color['hex'])
            
            # Compter les formats
            fmt = logo.get('format', 'UNKNOWN')
            format_counts[fmt] = format_counts.get(fmt, 0) + 1
            
            # Collecter les tailles
            sizes.append(logo.get('size_kb', 0))
            
        except Exception as e:
            print(f"Erreur lors de l'analyse de {logo['name']}: {e}")
            continue
    
    # Trouver les couleurs globales dominantes avec k-means sur toutes les couleurs
    global_colors = []
    if all_colors_rgb and SKLEARN_AVAILABLE:
        try:
            colors_array = np.array(all_colors_rgb)
            n_clusters = min(10, len(colors_array))
            if n_clusters > 0:
                kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                kmeans.fit(colors_array)
                
                cluster_centers = kmeans.cluster_centers_
                labels = kmeans.labels_
                
                unique_labels, counts = np.unique(labels, return_counts=True)
                
                for label, count in zip(unique_labels, counts):
                    center = cluster_centers[label]
                    r, g, b = int(center[0]), int(center[1]), int(center[2])
                    r = max(0, min(255, r))
                    g = max(0, min(255, g))
                    b = max(0, min(255, b))
                    
                    percentage = round((count / len(all_colors_rgb)) * 100, 2)
                    
                    global_colors.append({
                        'rgb': [r, g, b],
                        'hex': '#{:02x}{:02x}{:02x}'.format(r, g, b),
                        'frequency': int(count),
                        'percentage': percentage
                    })
                
                global_colors.sort(key=lambda x: x['percentage'], reverse=True)
        except Exception as e:
            print(f"Erreur lors du clustering global: {e}")
            # Fallback: utiliser les couleurs les plus fréquentes
            color_counts = Counter(all_colors_hex)
            top_colors = color_counts.most_common(10)
            for hex_color, count in top_colors:
                # Extraire RGB du hex
                hex_color = hex_color.lstrip('#')
                r = int(hex_color[0:2], 16)
                g = int(hex_color[2:4], 16)
                b = int(hex_color[4:6], 16)
                
                global_colors.append({
                    'rgb': [r, g, b],
                    'hex': '#' + hex_color,
                    'frequency': count,
                    'percentage': round((count / len(all_colors_hex)) * 100, 2)
                })
    
    # Distribution des couleurs par catégorie (approximative)
    color_distribution = {
        'red_dominant': sum(1 for c in all_colors_rgb if c[0] > max(c[1], c[2])),
        'green_dominant': sum(1 for c in all_colors_rgb if c[1] > max(c[0], c[2])),
        'blue_dominant': sum(1 for c in all_colors_rgb if c[2] > max(c[0], c[1])),
        'neutral': sum(1 for c in all_colors_rgb if abs(c[0] - c[1]) < 30 and abs(c[1] - c[2]) < 30)
    }
    
    return {
        'total_images': len(valid_logos),
        'global_colors': global_colors[:10],  # Top 10
        'color_distribution': color_distribution,
        'format_distribution': format_counts,
        'size_distribution': {
            'min': round(min(sizes), 2) if sizes else 0,
            'max': round(max(sizes), 2) if sizes else 0,
            'mean': round(np.mean(sizes), 2) if sizes else 0,
            'median': round(np.median(sizes), 2) if sizes else 0
        }
    }

def get_image_details(filename):
    """Récupère les détails complets d'une image"""
    logos_dir = get_logos_dir()
    filepath = os.path.join(logos_dir, filename)
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Image {filename} non trouvée dans {logos_dir}")
    
    try:
        with Image.open(filepath) as img:
            width, height = img.size
            format_type = img.format
            mode = img.mode
            file_size = os.path.getsize(filepath)
            
            # Analyser les couleurs (avec gestion d'erreur)
            colors = []
            histograms = None
            try:
                colors_data = analyze_image_colors(filename, use_kmeans=True)
                colors = colors_data.get('colors', [])
            except Exception as color_error:
                # Si l'analyse des couleurs échoue, on continue quand même avec les autres infos
                print(f"Warning: Impossible d'analyser les couleurs pour {filename}: {color_error}")
                colors = []
            
            # Calculer les histogrammes
            try:
                histograms = get_image_histograms(filename)
            except Exception as hist_error:
                print(f"Warning: Impossible de calculer les histogrammes pour {filename}: {hist_error}")
                histograms = None
            
            return {
                'name': filename,
                'path': f'/static/assets/images_clubs/{filename}',
                'width': width,
                'height': height,
                'format': format_type,
                'mode': mode,
                'size_bytes': file_size,
                'size_kb': round(file_size / 1024, 2),
                'aspect_ratio': round(width / height, 2) if height > 0 else 0,
                'colors': colors,
                'histograms': histograms
            }
    except FileNotFoundError:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erreur lors de la lecture de l'image {filename}: {error_details}")
        raise Exception(f"Erreur lors de la lecture de l'image: {str(e)}")

def process_image(files):
    """Traite une image uploadée"""
    if 'image' not in files:
        raise ValueError("Aucun fichier image fourni")
    
    file = files['image']
    if not file_utils.allowed_file(file.filename):
        raise ValueError("Format de fichier non autorisé")
    
    # Traitement de l'image
    return {'message': 'Image traitée avec succès'}
