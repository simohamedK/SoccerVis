from flask import Blueprint, jsonify, request
from app.services import csv_service

csv_bp = Blueprint('csv', __name__, url_prefix='/api/csv')

@csv_bp.route('/data', methods=['GET'])
def get_csv_data():
    """Récupère les données du CSV"""
    try:
        data = csv_service.get_csv_data()
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@csv_bp.route('/stats', methods=['GET'])
def get_csv_stats():
    """Récupère les statistiques du CSV"""
    try:
        stats = csv_service.get_stats()
        return jsonify({'status': 'success', 'stats': stats})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@csv_bp.route('/columns', methods=['GET'])
def get_columns():
    """Récupère les informations sur les colonnes"""
    try:
        columns_info = csv_service.get_columns_info()
        return jsonify({'status': 'success', 'columns': columns_info})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@csv_bp.route('/column/<column_name>/chart-types', methods=['GET'])
def get_chart_types(column_name):
    """Récupère les types de graphiques disponibles pour une colonne"""
    try:
        chart_types = csv_service.get_available_chart_types(column_name)
        return jsonify({'status': 'success', 'chart_types': chart_types})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@csv_bp.route('/column/<column_name>/data', methods=['GET'])
def get_column_data(column_name):
    """Récupère les données d'une colonne pour visualisation"""
    try:
        limit = request.args.get('limit', 100, type=int)
        data = csv_service.get_column_data(column_name, limit)
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@csv_bp.route('/nationality-map', methods=['GET'])
def get_nationality_map():
    """Récupère les données pour la carte des nationalités"""
    try:
        map_data = csv_service.get_nationality_map_data()
        return jsonify({'status': 'success', 'map_data': map_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@csv_bp.route('/random-visualization', methods=['GET'])
def get_random_visualization():
    """Génère une visualisation aléatoire"""
    try:
        chart_type = request.args.get('chart_type', None)
        viz_config = csv_service.get_random_visualization(chart_type=chart_type)
        if viz_config:
            # Récupérer les données pour cette visualisation
            column_data = csv_service.get_column_data(viz_config['column'], 100)
            return jsonify({
                'status': 'success',
                'visualization': {
                    'column': viz_config['column'],
                    'chart_type': viz_config['chart_type'],
                    'data': column_data
                }
            })
        else:
            return jsonify({'status': 'error', 'message': 'Aucune colonne disponible'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@csv_bp.route('/multiple-columns', methods=['POST'])
def get_multiple_columns():
    """Récupère les données de plusieurs colonnes"""
    try:
        data = request.json
        columns = data.get('columns', [])
        limit = data.get('limit', 100)
        
        if not columns:
            return jsonify({'status': 'error', 'message': 'Aucune colonne fournie'}), 400
        
        columns_data = csv_service.get_multiple_columns_data(columns, limit)
        return jsonify({'status': 'success', 'data': columns_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
