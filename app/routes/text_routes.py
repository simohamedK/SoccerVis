from flask import Blueprint, jsonify, request
from app.services import text_service
import os

text_bp = Blueprint('text', __name__, url_prefix='/api/text')

@text_bp.route('/articles', methods=['GET'])
def get_articles():
    """Récupère la liste des articles"""
    try:
        articles = text_service.get_articles_list()
        return jsonify({'status': 'success', 'articles': articles})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@text_bp.route('/analyze/<filename>', methods=['GET'])
def analyze_file(filename):
    """Analyse un fichier texte ou PDF"""
    try:
        # Utiliser le chemin depuis le service
        from app.services.text_service import TEXTS_DIR
        filepath = os.path.join(TEXTS_DIR, filename)
        if not os.path.exists(filepath):
            return jsonify({'status': 'error', 'message': 'Fichier non trouvé'}), 404
        
        result = text_service.analyze_text(filepath)
        return jsonify({'status': 'success', 'result': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@text_bp.route('/process', methods=['POST'])
def process_text():
    """Traite un texte fourni directement"""
    try:
        result = text_service.process_text(request.json)
        return jsonify({'status': 'success', 'result': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
