from flask import Blueprint, jsonify, request
from app.services import image_service

image_bp = Blueprint('image', __name__, url_prefix='/api/image')

@image_bp.route('/logos', methods=['GET'])
def get_logos():
    """Récupère la liste des logos de clubs"""
    try:
        logos = image_service.get_logos_list()
        return jsonify({'status': 'success', 'logos': logos})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@image_bp.route('/stats', methods=['GET'])
def get_image_stats():
    """Récupère les statistiques des images"""
    try:
        stats = image_service.get_image_stats()
        return jsonify({'status': 'success', 'stats': stats})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@image_bp.route('/analyze/<filename>', methods=['GET'])
def analyze_image(filename):
    """Analyse une image spécifique avec ses couleurs"""
    try:
        # Décoder le nom de fichier (au cas où il contient des caractères spéciaux)
        from urllib.parse import unquote
        filename = unquote(filename)
        
        details = image_service.get_image_details(filename)
        return jsonify({'status': 'success', 'image': details})
    except FileNotFoundError as e:
        return jsonify({'status': 'error', 'message': f'Image non trouvée: {str(e)}'}), 404
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in analyze_image for {filename}: {error_details}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@image_bp.route('/colors/<filename>', methods=['GET'])
def get_image_colors(filename):
    """Récupère les couleurs dominantes d'une image"""
    try:
        colors = image_service.analyze_image_colors(filename)
        return jsonify({'status': 'success', 'colors': colors})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@image_bp.route('/histograms/<filename>', methods=['GET'])
def get_histograms(filename):
    """Récupère les histogrammes RGB/HSV d'une image"""
    try:
        from urllib.parse import unquote
        filename = unquote(filename)
        histograms = image_service.get_image_histograms(filename)
        return jsonify({'status': 'success', 'histograms': histograms})
    except FileNotFoundError as e:
        return jsonify({'status': 'error', 'message': f'Image non trouvée: {str(e)}'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@image_bp.route('/comparison', methods=['GET'])
def get_clubs_comparison():
    """Récupère la comparaison des couleurs entre clubs"""
    try:
        limit = request.args.get('limit', 10, type=int)
        clubs_data = image_service.get_clubs_comparison(limit=limit)
        return jsonify({'status': 'success', 'clubs': clubs_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@image_bp.route('/global-analysis', methods=['GET'])
def get_global_analysis():
    """Récupère l'analyse globale de toutes les images"""
    try:
        analysis = image_service.get_all_images_analysis()
        return jsonify({'status': 'success', 'analysis': analysis})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@image_bp.route('/process', methods=['POST'])
def process_image():
    """Traite une image"""
    try:
        result = image_service.process_image(request.files)
        return jsonify({'status': 'success', 'result': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
