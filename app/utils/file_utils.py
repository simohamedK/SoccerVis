import os
from app.config import Config

def allowed_file(filename):
    """Vérifie si le fichier est autorisé"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def allowed_image_file(filename):
    """Vérifie si c'est une image autorisée"""
    allowed_images = {'jpg', 'jpeg', 'png', 'webp'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_images

def save_file(file, destination_folder):
    """Sauvegarde un fichier"""
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)
    
    filepath = os.path.join(destination_folder, file.filename)
    file.save(filepath)
    return filepath
