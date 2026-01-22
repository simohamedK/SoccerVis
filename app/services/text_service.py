import os
import re
from collections import Counter
import pdfplumber
import PyPDF2
from wordcloud import WordCloud
import io

# Chemin relatif depuis la racine du projet
def get_texts_dir():
    """Retourne le chemin du dossier des textes"""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    return os.path.join(base_dir, 'data', 'texts')

TEXTS_DIR = get_texts_dir()

def get_articles_list():
    """Retourne la liste des articles disponibles"""
    texts_dir = get_texts_dir()
    if not os.path.exists(texts_dir):
        return []
    
    articles = []
    for filename in os.listdir(texts_dir):
        filepath = os.path.join(texts_dir, filename)
        if os.path.isfile(filepath):
            file_size = os.path.getsize(filepath)
            file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            articles.append({
                'name': filename,
                'path': f'/data/texts/{filename}',
                'size_bytes': file_size,
                'size_kb': round(file_size / 1024, 2),
                'type': file_ext
            })
    return articles

def extract_text_from_pdf(filepath):
    """Extrait le texte d'un fichier PDF"""
    text = ""
    
    # Essayer d'abord avec pdfplumber (meilleur pour extraction)
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        # Fallback sur PyPDF2
        try:
            with open(filepath, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e2:
            raise Exception(f"Impossible d'extraire le texte du PDF: {str(e2)}")
    
    return text

def extract_text_from_file(filepath):
    """Extrait le texte d'un fichier (PDF ou TXT)"""
    file_ext = filepath.rsplit('.', 1)[1].lower() if '.' in filepath else ''
    
    if file_ext == 'pdf':
        return extract_text_from_pdf(filepath)
    elif file_ext == 'txt':
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        raise ValueError(f"Format de fichier non supporté: {file_ext}")

def clean_text(text):
    """Nettoie le texte pour l'analyse"""
    # Convertir en minuscules
    text = text.lower()
    # Supprimer les caractères spéciaux, garder seulement lettres, chiffres et espaces
    text = re.sub(r'[^a-zàâäéèêëïîôöùûüÿç\s]', ' ', text)
    # Supprimer les espaces multiples
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def get_word_frequencies(text, min_length=3, top_n=50):
    """Calcule les fréquences des mots"""
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    
    # Filtrer les mots courts et les mots vides (stop words basiques en français)
    stop_words = {'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 
                  'est', 'sont', 'dans', 'pour', 'avec', 'par', 'sur', 'sous',
                  'il', 'elle', 'ils', 'elles', 'ce', 'cette', 'ces', 'son', 'sa', 'ses',
                  'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi',
                  'être', 'avoir', 'faire', 'aller', 'venir', 'voir', 'dire',
                  'mais', 'donc', 'car', 'ainsi', 'alors', 'aussi', 'bien', 'très'}
    
    filtered_words = [w for w in words if len(w) >= min_length and w not in stop_words]
    
    word_counts = Counter(filtered_words)
    top_words = word_counts.most_common(top_n)
    
    return {
        'words': [word for word, count in top_words],
        'counts': [count for word, count in top_words],
        'total_words': len(filtered_words),
        'unique_words': len(word_counts)
    }

def generate_wordcloud_data(text):
    """Génère les données pour un nuage de mots avec filtrage des stop words"""
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    
    # Utiliser la même logique de filtrage que get_word_frequencies
    # Filtrer les mots courts (min_length=3, donc > 2 caractères) et les mots vides
    stop_words = {'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 
                  'est', 'sont', 'dans', 'pour', 'avec', 'par', 'sur', 'sous',
                  'il', 'elle', 'ils', 'elles', 'ce', 'cette', 'ces', 'son', 'sa', 'ses',
                  'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi',
                  'être', 'avoir', 'faire', 'aller', 'venir', 'voir', 'dire',
                  'mais', 'donc', 'car', 'ainsi', 'alors', 'aussi', 'bien', 'très'}
    
    # Filtrer les mots: longueur > 2 et pas de stop words
    filtered_words = [w for w in words if len(w) > 2 and w not in stop_words]
    
    # Créer un texte filtré pour WordCloud
    filtered_text = ' '.join(filtered_words)
    
    # Créer le WordCloud avec le texte filtré
    wordcloud = WordCloud(
        width=800,
        height=400,
        background_color='white',
        max_words=100,
        relative_scaling=0.5,
        collocations=False
    ).generate(filtered_text)
    
    # Convertir en format JSON pour le frontend
    word_freq = wordcloud.words_
    
    return {
        'words': list(word_freq.keys()),
        'frequencies': list(word_freq.values()),
        'max_frequency': max(word_freq.values()) if word_freq else 0
    }

def analyze_text(filepath):
    """Analyse complète d'un fichier texte"""
    # Extraire le texte
    text = extract_text_from_file(filepath)
    
    # Statistiques de base
    stats = {
        'total_characters': len(text),
        'total_words': len(text.split()),
        'total_sentences': len(re.split(r'[.!?]+', text)),
        'total_paragraphs': len([p for p in text.split('\n\n') if p.strip()])
    }
    
    # Fréquences des mots
    word_freq = get_word_frequencies(text)
    
    # Nuage de mots
    wordcloud_data = generate_wordcloud_data(text)
    
    return {
        'stats': stats,
        'word_frequencies': word_freq,
        'wordcloud': wordcloud_data
    }

def process_text(data):
    """Traite un texte fourni directement"""
    if not data or 'text' not in data:
        raise ValueError("Aucun texte fourni")
    
    text = data['text']
    
    # Statistiques de base
    stats = {
        'total_characters': len(text),
        'total_words': len(text.split()),
        'total_sentences': len(re.split(r'[.!?]+', text))
    }
    
    # Fréquences des mots
    word_freq = get_word_frequencies(text)
    
    # Nuage de mots
    wordcloud_data = generate_wordcloud_data(text)
    
    return {
        'stats': stats,
        'word_frequencies': word_freq,
        'wordcloud': wordcloud_data
    }
