import os

class Config:
    """Configuration de l'application Flask"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    DEBUG = True
    UPLOAD_FOLDER = 'data'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'csv', 'txt', 'pdf', 'jpg', 'jpeg', 'png', 'webp'}
