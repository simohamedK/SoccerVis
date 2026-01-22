// Text UI Handler avec visualisations

let textCharts = {};
let currentAnalysis = null;

function initializeText() {
    console.log('Initializing Text UI');
    loadArticles();
}

function loadArticles() {
    fetch('/api/text/articles')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayArticles(data.articles);
            }
        })
        .catch(error => console.error('Error loading articles:', error));
}

function displayArticles(articles) {
    const container = document.getElementById('articles-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (articles.length === 0) {
        container.innerHTML = '<p>Aucun fichier texte trouvé dans le dossier texts/</p>';
        return;
    }
    
    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'card article-card';
        card.innerHTML = `
            <h3>${article.name}</h3>
            <p><small>Taille: ${article.size_kb} KB | Type: ${article.type}</small></p>
            <button onclick="analyzeFile('${article.name}')" class="analyze-btn">Analyser</button>
        `;
        container.appendChild(card);
    });
}

function analyzeFile(filename) {
    // Afficher un indicateur de chargement
    const container = document.getElementById('articles-container');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'text-analysis-loading';
    loadingDiv.innerHTML = '<p>Analyse en cours...</p>';
    container.appendChild(loadingDiv);
    
    fetch(`/api/text/analyze/${encodeURIComponent(filename)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                currentAnalysis = data.result;
                displayTextAnalysis(data.result, filename);
            } else {
                alert('Erreur: ' + data.message);
            }
            document.getElementById('text-analysis-loading')?.remove();
        })
        .catch(error => {
            console.error('Error analyzing file:', error);
            alert('Erreur lors de l\'analyse du fichier');
            document.getElementById('text-analysis-loading')?.remove();
        });
}

function displayTextAnalysis(analysis, filename) {
    const container = document.getElementById('articles-container');
    if (!container) return;
    
    // Supprimer l'analyse précédente si elle existe
    const existingAnalysis = document.getElementById('text-analysis-display');
    if (existingAnalysis) {
        existingAnalysis.remove();
    }
    
    // Supprimer aussi le message de chargement s'il existe
    const loadingDiv = document.getElementById('text-analysis-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
    
    const analysisHTML = `
        <div class="text-analysis-section">
            <h3>Analyse de: ${filename}</h3>
            
            <div class="text-stats-grid">
                <div class="stat-card">
                    <h4>Caractères</h4>
                    <p>${analysis.stats.total_characters.toLocaleString()}</p>
                </div>
                <div class="stat-card">
                    <h4>Mots</h4>
                    <p>${analysis.stats.total_words.toLocaleString()}</p>
                </div>
                <div class="stat-card">
                    <h4>Phrases</h4>
                    <p>${analysis.stats.total_sentences.toLocaleString()}</p>
                </div>
                <div class="stat-card">
                    <h4>Mots uniques</h4>
                    <p>${analysis.word_frequencies.unique_words.toLocaleString()}</p>
                </div>
            </div>
            
            <div class="text-visualizations">
                <div class="viz-container">
                    <h4>Top 20 Mots les Plus Fréquents</h4>
                    <canvas id="word-frequency-chart"></canvas>
                </div>
                
                <div class="viz-container">
                    <h4>Nuage de Mots Interactif</h4>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
                        Survolez les mots pour voir leur fréquence. Cliquez sur un mot pour plus de détails.
                    </p>
                    <div id="wordcloud-container" style="
                        width: 100%;
                        min-height: 500px;
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(106, 176, 76, 0.05));
                        border-radius: 12px;
                        padding: 2rem;
                        border: 2px dashed rgba(106, 176, 76, 0.3);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    ">
                        <p style="color: #999;">Génération du nuage de mots...</p>
                    </div>
                </div>
            </div>
            
            <button onclick="closeAnalysis()" class="close-btn">Fermer l'analyse</button>
        </div>
    `;
    
    // Ajouter l'analyse à la fin du conteneur
    const analysisDiv = document.createElement('div');
    analysisDiv.id = 'text-analysis-display';
    analysisDiv.innerHTML = analysisHTML;
    container.appendChild(analysisDiv);
    
    // Attendre que le DOM soit mis à jour avant de créer les visualisations
    setTimeout(() => {
        createWordFrequencyChart(analysis.word_frequencies);
        createWordCloud(analysis.wordcloud);
    }, 100);
}

function createWordFrequencyChart(wordFreq) {
    const ctx = document.getElementById('word-frequency-chart').getContext('2d');
    
    // Détruire le graphique précédent
    if (textCharts.wordFrequency) {
        textCharts.wordFrequency.destroy();
    }
    
    // Prendre les top 20
    const topWords = wordFreq.words.slice(0, 20);
    const topCounts = wordFreq.counts.slice(0, 20);
    
    textCharts.wordFrequency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topWords,
            datasets: [{
                label: 'Fréquence',
                data: topCounts,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Graphique horizontal
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}

function createWordCloud(wordcloudData) {
    const container = document.getElementById('wordcloud-container');
    if (!container) return;
    
    // Nettoyer le conteneur
    container.innerHTML = '<canvas id="wordcloud-canvas"></canvas>';
    const canvas = document.getElementById('wordcloud-canvas');
    
    // Définir la taille du canvas (responsive)
    const containerWidth = container.offsetWidth || 800;
    const containerHeight = 500;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Préparer les données pour WordCloud2
    const words = wordcloudData.words;
    const frequencies = wordcloudData.frequencies;
    const maxFreq = wordcloudData.max_frequency;
    
    // Créer le tableau de mots avec leurs poids
    const wordList = words.slice(0, 100).map((word, index) => {
        const freq = frequencies[index] || 1;
        // Normaliser la fréquence pour la taille (entre 10 et 80)
        const weight = 10 + (freq / maxFreq) * 70;
        return [word, weight];
    });
    
    // Configuration du nuage de mots interactif
    const options = {
        list: wordList,
        gridSize: Math.round(16 * containerWidth / 1024),
        weightFactor: function (size) {
            return size;
        },
        fontFamily: 'Inter, Arial, sans-serif',
        color: function () {
            // Générer des couleurs dans le thème football (verts)
            const colors = [
                '#2d5016', '#4a7c2a', '#6ab04c', '#3d8b3d', '#5cb85c',
                '#28a745', '#45b049', '#67c23a', '#85ce61', '#95d475'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        },
        rotateRatio: 0.3, // 30% des mots seront tournés
        rotationSteps: 2, // Rotation par pas de 90 degrés
        backgroundColor: 'transparent',
        minSize: 10,
        drawOutOfBound: false,
        shrinkToFit: true,
        hover: function(item) {
            // Effet au survol
            if (item) {
                canvas.style.cursor = 'pointer';
                // Trouver le mot dans la liste pour afficher sa fréquence
                const wordIndex = words.indexOf(item[0]);
                if (wordIndex !== -1) {
                    const freq = frequencies[wordIndex];
                    const tooltip = document.getElementById('wordcloud-tooltip');
                    if (tooltip) {
                        tooltip.textContent = `${item[0]}: ${freq} occurrences`;
                        tooltip.style.display = 'block';
                        tooltip.style.left = (event.clientX + 10) + 'px';
                        tooltip.style.top = (event.clientY + 10) + 'px';
                    }
                }
            } else {
                canvas.style.cursor = 'default';
                const tooltip = document.getElementById('wordcloud-tooltip');
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            }
        },
        click: function(item) {
            // Action au clic - afficher les détails du mot
            if (item) {
                const wordIndex = words.indexOf(item[0]);
                if (wordIndex !== -1) {
                    const freq = frequencies[wordIndex];
                    showWordDetails(item[0], freq, wordIndex);
                }
            }
        }
    };
    
    // Créer le tooltip si il n'existe pas
    if (!document.getElementById('wordcloud-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'wordcloud-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(45, 80, 22, 0.95);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
            pointer-events: none;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        container.style.position = 'relative';
        container.appendChild(tooltip);
    }
    
    // Gérer le survol de la souris pour le tooltip
    canvas.addEventListener('mousemove', function(event) {
        const tooltip = document.getElementById('wordcloud-tooltip');
        if (tooltip && tooltip.style.display === 'block') {
            tooltip.style.left = (event.clientX + 10) + 'px';
            tooltip.style.top = (event.clientY + 10) + 'px';
        }
    });
    
    // Générer le nuage de mots
    try {
        WordCloud(canvas, options);
    } catch (error) {
        console.error('Erreur lors de la création du nuage de mots:', error);
        container.innerHTML = '<p style="color: #999; text-align: center;">Erreur lors de la génération du nuage de mots</p>';
    }
}

function showWordDetails(word, frequency, rank) {
    // Créer une modale pour afficher les détails du mot
    const modal = document.createElement('div');
    modal.className = 'word-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div class="word-details-content" style="
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            position: relative;
        ">
            <span class="word-details-close" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                font-size: 2rem;
                cursor: pointer;
                color: #666;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: rgba(0,0,0,0.05);
                transition: all 0.3s;
            ">&times;</span>
            <h3 style="color: var(--field-green); margin-bottom: 1rem; font-weight: 700;">Détails du Mot</h3>
            <div style="margin-bottom: 1rem;">
                <p style="font-size: 1.5rem; font-weight: 700; color: #333; margin-bottom: 0.5rem;">${word}</p>
                <p style="color: #666;"><strong>Fréquence:</strong> ${frequency} occurrence${frequency > 1 ? 's' : ''}</p>
                <p style="color: #666;"><strong>Rang:</strong> #${rank + 1}</p>
            </div>
            <button class="close-word-details" style="
                background: linear-gradient(135deg, var(--primary-color), var(--field-green));
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            ">Fermer</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fermer la modale
    const closeBtn = modal.querySelector('.word-details-close, .close-word-details');
    closeBtn.addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        }
    });
    
    // Effet hover sur le bouton de fermeture
    const closeIcon = modal.querySelector('.word-details-close');
    closeIcon.addEventListener('mouseenter', () => {
        closeIcon.style.background = 'rgba(220, 53, 69, 0.1)';
        closeIcon.style.color = '#dc3545';
        closeIcon.style.transform = 'rotate(90deg)';
    });
    closeIcon.addEventListener('mouseleave', () => {
        closeIcon.style.background = 'rgba(0,0,0,0.05)';
        closeIcon.style.color = '#666';
        closeIcon.style.transform = 'rotate(0deg)';
    });
}

function closeAnalysis() {
    const analysisDiv = document.getElementById('text-analysis-display');
    if (analysisDiv) {
        analysisDiv.remove();
    }
    
    // Détruire les graphiques
    if (textCharts.wordFrequency) {
        textCharts.wordFrequency.destroy();
        textCharts.wordFrequency = null;
    }
    
    currentAnalysis = null;
}

function processText(text) {
    fetch('/api/text/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayTextAnalysis(data.result, 'Texte personnalisé');
            }
        })
        .catch(error => console.error('Error processing text:', error));
}
