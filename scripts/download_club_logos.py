"""
Script pour télécharger les logos des clubs de football
"""

import os
import requests
from pathlib import Path

# Dossier de destination
LOGOS_DIR = Path(__file__).parent.parent / 'static' / 'assets' / 'images_clubs'

def download_logos():
    """Télécharge les logos des clubs"""
    LOGOS_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"Logos seront sauvegardés dans: {LOGOS_DIR}")
    print("Ajoutez vos URLs de logos ici pour les télécharger automatiquement")
    
    # Exemple de structure - à personnaliser avec vos URLs
    clubs = {
        # 'club_name': 'url_du_logo',
    }
    
    for club_name, logo_url in clubs.items():
        try:
            response = requests.get(logo_url, timeout=10)
            if response.status_code == 200:
                # Déterminer l'extension
                content_type = response.headers.get('content-type', '')
                ext = 'png'
                if 'jpeg' in content_type:
                    ext = 'jpg'
                elif 'webp' in content_type:
                    ext = 'webp'
                
                filename = f"{club_name}.{ext}"
                filepath = LOGOS_DIR / filename
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                print(f"✓ Téléchargé: {filename}")
            else:
                print(f"✗ Erreur pour {club_name}: {response.status_code}")
        except Exception as e:
            print(f"✗ Erreur lors du téléchargement de {club_name}: {str(e)}")

if __name__ == '__main__':
    download_logos()
    print("\nTéléchargement terminé!")
