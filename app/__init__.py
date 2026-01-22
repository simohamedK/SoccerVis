from flask import Flask, render_template
import os

def create_app():
    # Définir les chemins absolus pour templates et static
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    
    app = Flask(__name__, 
                template_folder=template_dir,
                static_folder=static_dir)
    app.config.from_object('app.config.Config')
    
    # Routes principales
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/csv')
    def csv_page():
        return render_template('csv.html')
    
    @app.route('/images')
    def images_page():
        return render_template('images.html')
    
    @app.route('/text')
    def text_page():
        return render_template('text.html')
    
    # Register blueprints
    from app.routes import csv_routes, image_routes, text_routes
    app.register_blueprint(csv_routes.csv_bp)
    app.register_blueprint(image_routes.image_bp)
    app.register_blueprint(text_routes.text_bp)
    
    return app
