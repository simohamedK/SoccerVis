// Image UI Handler avec visualisations dynamiques en bulles

let imageCharts = {};
let logosData = [];

function initializeImages() {
    console.log('Initializing Image UI');
    // Charger d'abord les stats pour créer le layout, puis les logos
    loadImageStats();
    // Attendre que le layout soit créé avant de charger les logos
    setTimeout(() => {
    loadLogos();
    }, 300);
}

function loadImageStats() {
    fetch('/api/image/stats')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayImageStats(data.stats);
            }
        })
        .catch(error => console.error('Error loading image stats:', error));
}

function displayImageStats(stats) {
    const container = document.getElementById('logos-container');
    if (!container) {
        console.error('Container logos-container not found!');
        return;
    }
    
    console.log('Displaying image stats, stats object:', stats);
    
    // Layout avec stats à droite et logos au centre
    const statsHTML = `
        <div class="images-layout">
            <div class="logos-bubbles-container">
                <h3>Logos des Clubs</h3>
                <div id="logos-bubbles" class="bubbles-container"></div>
            </div>
            <div class="image-stats-sidebar">
                <h3>Statistiques</h3>
                <div class="stats-vertical">
                    <div class="stat-card-vertical">
                        <h4>Total</h4>
                        <p>${stats.total || 0}</p>
                        <small>images</small>
                    </div>
                    <div class="stat-card-vertical">
                        <h4>Valides</h4>
                        <p>${stats.valid || 0}</p>
                        <small>images</small>
                    </div>
                    <div class="stat-card-vertical">
                        <h4>Largeur</h4>
                        <p>${stats.width ? stats.width.mean.toFixed(0) : 0}</p>
                        <small>px (moyenne)</small>
                    </div>
                    <div class="stat-card-vertical">
                        <h4>Hauteur</h4>
                        <p>${stats.height ? stats.height.mean.toFixed(0) : 0}</p>
                        <small>px (moyenne)</small>
                    </div>
                    <div class="stat-card-vertical">
                        <h4>Taille</h4>
                        <p>${stats.size_kb ? stats.size_kb.mean.toFixed(1) : 0}</p>
                        <small>KB (moyenne)</small>
                    </div>
                    <div class="stat-card-vertical">
                        <h4>Total</h4>
                        <p>${stats.size_kb ? stats.size_kb.total.toFixed(1) : 0}</p>
                        <small>KB</small>
                    </div>
                </div>
                <div class="formats-stats">
                    <h4>Formats</h4>
                    <div class="format-list">
                        ${stats.formats && Object.keys(stats.formats).length > 0 
                            ? Object.entries(stats.formats).map(([fmt, count]) => 
                                `<div class="format-item">
                                    <span class="format-name">${fmt || 'N/A'}</span>
                                    <span class="format-count">${count || 0}</span>
                                </div>`
                            ).join('')
                            : '<p style="color: #999; font-size: 0.9rem;">Aucun format disponible</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
        <div class="global-visualizations-section" style="margin-top: 2rem; padding: 2rem; background: var(--card-bg); border-radius: 12px; box-shadow: var(--card-shadow); border: 2px solid transparent;">
            <h3 style="color: var(--field-green); margin-bottom: 1.5rem; font-weight: 700; text-align: center; font-size: 1.3rem; text-transform: uppercase; letter-spacing: 0.5px;">Analyse Globale de Toutes les Images</h3>
            <div id="global-visualizations" class="global-visualizations">
                <p style="text-align: center; color: #666;">Chargement de l'analyse globale...</p>
            </div>
        </div>
        
    `;
    
    container.innerHTML = statsHTML;
    console.log('Stats HTML inserted, waiting for logos...');
    
    // Ajouter un indicateur de chargement dans le conteneur des bulles
    const bubblesContainer = document.getElementById('logos-bubbles');
    if (bubblesContainer) {
        bubblesContainer.innerHTML = '<div style="text-align: center; padding: 3rem; color: #666;"><p>Chargement des logos...</p></div>';
    }
    
    // Charger l'analyse globale et la comparaison entre clubs
    setTimeout(() => {
        loadGlobalAnalysis();
        loadClubsComparison();
    }, 500);
}

function loadLogos() {
    console.log('Loading logos...');
    fetch('/api/image/logos')
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Logos data received:', data);
            if (data.status === 'success') {
                logosData = data.logos.filter(logo => !logo.error);
                console.log(`Found ${logosData.length} valid logos out of ${data.logos.length} total`);
                if (logosData.length > 0) {
                    displayLogosBubbles(logosData);
                } else {
                    const container = document.getElementById('logos-bubbles');
                    if (container) {
                        container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #999;"><p>Aucun logo valide trouvé</p></div>';
                    }
                }
            } else {
                console.error('Error in logos response:', data.message);
                const container = document.getElementById('logos-bubbles');
                if (container) {
                    container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #dc3545;"><p>Erreur: ${data.message || 'Erreur inconnue'}</p></div>`;
                }
            }
        })
        .catch(error => {
            console.error('Error loading logos:', error);
            const container = document.getElementById('logos-bubbles');
    if (container) {
                container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #dc3545;"><p>Erreur lors du chargement des logos. Vérifiez la console pour plus de détails.</p></div>';
            }
        });
}

function displayLogosBubbles(logos) {
    const container = document.getElementById('logos-bubbles');
    if (!container) {
        console.error('Container logos-bubbles not found, retrying...');
        setTimeout(() => displayLogosBubbles(logos), 200);
        return;
    }
    
    if (!logos || logos.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #999;"><p>Aucun logo disponible</p></div>';
        console.warn('No logos to display');
        return;
    }
    
    console.log(`Displaying ${logos.length} logos in bubbles`);
        container.innerHTML = '';
    
    // Créer des bulles avec positions aléatoires mais organisées
    logos.forEach((logo, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'logo-bubble';
        
        // Position aléatoire mais avec espacement minimum
        const maxAttempts = 10;
        let left, top, overlap = false;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            left = Math.random() * 75 + 5; // Entre 5% et 80%
            top = Math.random() * 75 + 5;  // Entre 5% et 80%
            
            // Vérifier les chevauchements avec les bulles existantes
            overlap = false;
            const existingBubbles = container.querySelectorAll('.logo-bubble');
            for (let existing of existingBubbles) {
                const exLeft = parseFloat(existing.style.left);
                const exTop = parseFloat(existing.style.top);
                const distance = Math.sqrt(Math.pow(left - exLeft, 2) + Math.pow(top - exTop, 2));
                if (distance < 15) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) break;
        }
        
        bubble.style.left = `${left}%`;
        bubble.style.top = `${top}%`;
        bubble.style.animationDelay = `${index * 0.1}s`;
        bubble.style.zIndex = index;
        
        const logoName = logo.name.replace(/\.[^/.]+$/, '').replace(/\.(png|jpg|jpeg)$/i, '');
        
        bubble.innerHTML = `
            <img src="${logo.path}" alt="${logoName}" loading="lazy" 
                 onerror="console.error('Error loading image: ${logo.path}'); this.style.display='none';">
            <div class="bubble-overlay">
                <span class="bubble-name">${logoName}</span>
            </div>
        `;
        
        bubble.addEventListener('click', () => {
            showImageModal(logo);
        });
        
        container.appendChild(bubble);
    });
    
    console.log(`Successfully displayed ${logos.length} logo bubbles`);
}

function showImageModal(logo) {
    // Créer le modal
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.id = 'image-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <div class="modal-header">
                <h3>${logo.name}</h3>
            </div>
            <div class="modal-body">
                <div class="modal-image-container">
                    <img src="${logo.path}" alt="${logo.name}" id="modal-image">
                </div>
                <div class="modal-info">
                    <div class="info-section">
                        <h4>Informations</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Dimensions:</label>
                                <span>${logo.width} × ${logo.height} px</span>
                            </div>
                            <div class="info-item">
                                <label>Taille:</label>
                                <span>${logo.size_kb} KB</span>
                            </div>
                            <div class="info-item">
                                <label>Format:</label>
                                <span>${logo.format}</span>
                            </div>
                            <div class="info-item">
                                <label>Ratio:</label>
                                <span>${logo.aspect_ratio}</span>
                            </div>
                        </div>
                    </div>
                    <div class="colors-section">
                        <h4>Couleurs Dominantes (K-means)</h4>
                        <div id="colors-display" class="colors-display">
                            <p>Chargement...</p>
                        </div>
                    </div>
                    <div class="histograms-section">
                        <h4>Histogrammes RGB / HSV</h4>
                        <div id="histograms-display" class="histograms-display">
                            <p>Chargement...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Charger les couleurs et histogrammes
    loadImageColors(logo.name);
    loadImageHistograms(logo.name);
    
    // Fermer le modal
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function loadImageColors(filename) {
    console.log('Loading colors for:', filename);
    const colorsDisplay = document.getElementById('colors-display');
    if (!colorsDisplay) {
        console.error('colors-display element not found');
        return;
    }
    
    fetch(`/api/image/analyze/${encodeURIComponent(filename)}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Colors data received:', data);
            if (data.status === 'success' && data.image) {
                const colors = data.image.colors || [];
                if (colors && colors.length > 0) {
                    displayImageColors(colors);
                } else {
                    colorsDisplay.innerHTML = 
                        '<p style="color: #999;">Aucune couleur détectée dans l\'image</p>';
                }
            } else {
                console.error('Error in response:', data);
                colorsDisplay.innerHTML = 
                    `<p style="color: #dc3545;">Erreur: ${data.message || 'Impossible de charger les couleurs'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error loading colors:', error);
            const colorsDisplay = document.getElementById('colors-display');
            if (colorsDisplay) {
                colorsDisplay.innerHTML = 
                    `<p style="color: #dc3545;">Erreur lors du chargement: ${error.message}</p>`;
            }
        });
}

function displayImageColors(colors) {
    const container = document.getElementById('colors-display');
    if (!container) return;
    
    if (!colors || colors.length === 0) {
        container.innerHTML = '<p style="color: #999;">Aucune couleur détectée</p>';
        return;
    }
    
    const colorsHTML = `
        <div class="colors-grid">
            ${colors.map((color, index) => `
                <div class="color-item">
                    <div class="color-swatch" style="background-color: ${color.hex};"></div>
                    <div class="color-info">
                        <div class="color-hex">${color.hex}</div>
                        <div class="color-percentage">${color.percentage}%</div>
                        <div class="color-rgb">RGB(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="colors-chart-container">
            <canvas id="colors-chart"></canvas>
        </div>
    `;
    
    container.innerHTML = colorsHTML;
    
    // Créer un graphique en barres pour les couleurs
    const ctx = document.getElementById('colors-chart').getContext('2d');
    if (imageCharts.colors) {
        imageCharts.colors.destroy();
    }
    
    imageCharts.colors = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: colors.map((c, i) => `Couleur ${i + 1}`),
            datasets: [{
                label: 'Pourcentage (%)',
                data: colors.map(c => c.percentage),
                backgroundColor: colors.map(c => c.hex),
                borderColor: colors.map(c => c.hex),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Pourcentage (%)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Couleurs Dominantes (K-means)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const color = colors[context.dataIndex];
                            return `${color.hex}: ${color.percentage}% (RGB: ${color.rgb.join(', ')})`;
                        }
                    }
                }
            }
        }
    });
}

function loadImageHistograms(filename) {
    console.log('Loading histograms for:', filename);
    const histogramsDisplay = document.getElementById('histograms-display');
    if (!histogramsDisplay) {
        console.error('histograms-display element not found');
        return;
    }
    
    fetch(`/api/image/histograms/${encodeURIComponent(filename)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success' && data.histograms) {
                displayImageHistograms(data.histograms);
            } else {
                histogramsDisplay.innerHTML = 
                    '<p style="color: #999;">Impossible de charger les histogrammes</p>';
            }
        })
        .catch(error => {
            console.error('Error loading histograms:', error);
            if (histogramsDisplay) {
                histogramsDisplay.innerHTML = 
                    '<p style="color: #999;">Erreur lors du chargement des histogrammes</p>';
            }
        });
}

function displayImageHistograms(histograms) {
    const container = document.getElementById('histograms-display');
    if (!container) return;
    
    if (!histograms || (!histograms.rgb && !histograms.hsv)) {
        container.innerHTML = '<p style="color: #999;">Aucun histogramme disponible</p>';
        return;
    }
    
    const histogramsHTML = `
        <div class="histograms-tabs">
            <button class="histogram-tab active" data-tab="rgb">RGB</button>
            <button class="histogram-tab" data-tab="hsv">HSV</button>
        </div>
        <div class="histogram-content">
            <div id="rgb-histogram" class="histogram-chart active">
                <canvas id="rgb-chart"></canvas>
            </div>
            <div id="hsv-histogram" class="histogram-chart">
                <canvas id="hsv-chart"></canvas>
            </div>
        </div>
    `;
    
    container.innerHTML = histogramsHTML;
    
    // Gestion des onglets
    const tabs = container.querySelectorAll('.histogram-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.histogram-chart').forEach(chart => {
                chart.classList.remove('active');
            });
            document.getElementById(`${tabName}-histogram`).classList.add('active');
        });
    });
    
    // Créer les graphiques
    if (histograms.rgb) {
        const rgbCtx = document.getElementById('rgb-chart').getContext('2d');
        if (imageCharts.rgb) {
            imageCharts.rgb.destroy();
        }
        
        // Réduire la résolution pour les histogrammes (prendre un échantillon)
        const sampleSize = 50;
        const rData = sampleArray(histograms.rgb.r, sampleSize);
        const gData = sampleArray(histograms.rgb.g, sampleSize);
        const bData = sampleArray(histograms.rgb.b, sampleSize);
        const labels = Array.from({length: sampleSize}, (_, i) => Math.floor((i / sampleSize) * 256));
        
        imageCharts.rgb = new Chart(rgbCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rouge',
                        data: rData,
                        borderColor: 'rgb(255, 0, 0)',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Vert',
                        data: gData,
                        borderColor: 'rgb(0, 255, 0)',
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Bleu',
                        data: bData,
                        borderColor: 'rgb(0, 0, 255)',
                        backgroundColor: 'rgba(0, 0, 255, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fréquence',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Valeur (0-255)',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }
    
    if (histograms.hsv) {
        const hsvCtx = document.getElementById('hsv-chart').getContext('2d');
        if (imageCharts.hsv) {
            imageCharts.hsv.destroy();
        }
        
        const sampleSize = 50;
        const hData = sampleArray(histograms.hsv.h, sampleSize);
        const sData = sampleArray(histograms.hsv.s, sampleSize);
        const vData = sampleArray(histograms.hsv.v, sampleSize);
        const hLabels = Array.from({length: sampleSize}, (_, i) => Math.floor((i / sampleSize) * 360));
        const svLabels = Array.from({length: sampleSize}, (_, i) => Math.floor((i / sampleSize) * 100));
        
        imageCharts.hsv = new Chart(hsvCtx, {
            type: 'line',
            data: {
                labels: hLabels,
                datasets: [
                    {
                        label: 'Teinte (H)',
                        data: hData,
                        borderColor: 'rgb(255, 165, 0)',
                        backgroundColor: 'rgba(255, 165, 0, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Saturation (S)',
                        data: sData,
                        borderColor: 'rgb(0, 128, 255)',
                        backgroundColor: 'rgba(0, 128, 255, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Valeur (V)',
                        data: vData,
                        borderColor: 'rgb(128, 128, 128)',
                        backgroundColor: 'rgba(128, 128, 128, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'H (0-360)',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'S/V (0-100)',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Valeur',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }
}

function sampleArray(arr, size) {
    if (arr.length <= size) return arr;
    const step = Math.floor(arr.length / size);
    const sampled = [];
    for (let i = 0; i < arr.length; i += step) {
        sampled.push(arr[i]);
        if (sampled.length >= size) break;
    }
    return sampled;
}

function loadClubsComparison() {
    const comparisonDisplay = document.getElementById('comparison-display');
    if (!comparisonDisplay) {
        console.error('comparison-display element not found');
        return;
    }
    
    fetch('/api/image/comparison?limit=10')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success' && data.clubs) {
                displayClubsComparison(data.clubs);
            } else {
                comparisonDisplay.innerHTML = 
                    '<p style="color: #999; text-align: center;">Impossible de charger la comparaison</p>';
            }
        })
        .catch(error => {
            console.error('Error loading comparison:', error);
            if (comparisonDisplay) {
                comparisonDisplay.innerHTML = 
                    '<p style="color: #dc3545; text-align: center;">Erreur lors du chargement de la comparaison</p>';
            }
        });
}

function displayClubsComparison(clubs) {
    const container = document.getElementById('comparison-display');
    if (!container) return;
    
    if (!clubs || clubs.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">Aucune donnée de comparaison disponible</p>';
        return;
    }
    
    // Créer un graphique de comparaison
    const comparisonHTML = `
        <div class="comparison-chart-container">
            <canvas id="comparison-chart"></canvas>
        </div>
        <div class="clubs-palette-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin-top: 2rem;">
            ${clubs.map(club => `
                <div class="club-palette-card" style="background: var(--card-bg); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--field-green); text-align: center;">${club.name}</h5>
                    <div class="club-colors" style="display: flex; gap: 2px; height: 30px; border-radius: 4px; overflow: hidden;">
                        ${club.colors.map(color => `
                            <div style="flex: 1; background-color: ${color.hex};" title="${color.hex} (${color.percentage}%)"></div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = comparisonHTML;
    
    // Créer le graphique de comparaison
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    // Préparer les données pour le graphique
    const labels = clubs.map(c => c.name);
    const datasets = [];
    
    // Créer un dataset pour chaque position de couleur (top 3)
    for (let i = 0; i < 3; i++) {
        const colors = clubs.map(club => {
            const color = club.colors[i];
            return color ? color.percentage : 0;
        });
        
        const colorHexes = clubs.map(club => {
            const color = club.colors[i];
            return color ? color.hex : '#cccccc';
        });
        
        datasets.push({
            label: `Couleur ${i + 1}`,
            data: colors,
            backgroundColor: colorHexes,
            borderColor: colorHexes,
            borderWidth: 2
        });
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Pourcentage (%)',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Clubs',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const club = clubs[context.dataIndex];
                            const color = club.colors[context.datasetIndex];
                            if (color) {
                                return `${color.hex}: ${color.percentage}%`;
                            }
                            return 'N/A';
                        }
                    }
                }
            }
        }
    });
}

function loadGlobalAnalysis() {
    const globalVizContainer = document.getElementById('global-visualizations');
    if (!globalVizContainer) {
        console.error('global-visualizations element not found');
        return;
    }
    
    fetch('/api/image/global-analysis')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success' && data.analysis) {
                displayGlobalAnalysis(data.analysis);
            } else {
                globalVizContainer.innerHTML = 
                    '<p style="color: #999; text-align: center;">Impossible de charger l\'analyse globale</p>';
            }
        })
        .catch(error => {
            console.error('Error loading global analysis:', error);
            if (globalVizContainer) {
                globalVizContainer.innerHTML = 
                    '<p style="color: #dc3545; text-align: center;">Erreur lors du chargement de l\'analyse globale</p>';
            }
        });
}

function displayGlobalAnalysis(analysis) {
    const container = document.getElementById('global-visualizations');
    if (!container) return;
    
    if (!analysis || analysis.total_images === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">Aucune donnée disponible</p>';
        return;
    }
    
    const globalHTML = `
        <div class="global-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="global-stat-card" style="background: linear-gradient(135deg, var(--primary-color), var(--field-green)); color: white; padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(45, 80, 22, 0.3);">
                <h4 style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Total Images</h4>
                <p style="font-size: 2rem; font-weight: 700;">${analysis.total_images}</p>
            </div>
            <div class="global-stat-card" style="background: linear-gradient(135deg, var(--primary-color), var(--field-green)); color: white; padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(45, 80, 22, 0.3);">
                <h4 style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Taille Moyenne</h4>
                <p style="font-size: 2rem; font-weight: 700;">${analysis.size_distribution.mean.toFixed(1)} KB</p>
            </div>
            <div class="global-stat-card" style="background: linear-gradient(135deg, var(--primary-color), var(--field-green)); color: white; padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(45, 80, 22, 0.3);">
                <h4 style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Couleurs Uniques</h4>
                <p style="font-size: 2rem; font-weight: 700;">${analysis.global_colors.length}</p>
            </div>
        </div>
        
        <div class="global-colors-section" style="margin-bottom: 2rem;">
            <h4 style="color: var(--field-green); margin-bottom: 1rem; font-weight: 700; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.5px;">Palette Globale Dominante</h4>
            <div class="global-colors-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                ${analysis.global_colors.map((color, index) => `
                    <div class="global-color-item" style="text-align: center; background: var(--card-bg); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 2px solid transparent; transition: all 0.3s;">
                        <div class="global-color-swatch" style="width: 80px; height: 80px; border-radius: 12px; margin: 0 auto 0.5rem; background-color: ${color.hex}; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 3px solid white;"></div>
                        <div class="global-color-info">
                            <div style="font-weight: 600; color: var(--field-green); font-size: 0.85rem; margin-bottom: 0.25rem;">${color.hex}</div>
                            <div style="font-size: 0.75rem; color: #666;">${color.percentage}%</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="global-colors-chart-container" style="min-height: 300px;">
                <canvas id="global-colors-chart"></canvas>
            </div>
        </div>
        
        <div class="global-distributions" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
            <div class="color-distribution-section">
                <h4 style="color: var(--field-green); margin-bottom: 1rem; font-weight: 700; font-size: 1.1rem;">Distribution des Couleurs</h4>
                <div class="color-distribution-chart" style="min-height: 250px;">
                    <canvas id="color-distribution-chart"></canvas>
                </div>
            </div>
            <div class="format-distribution-section">
                <h4 style="color: var(--field-green); margin-bottom: 1rem; font-weight: 700; font-size: 1.1rem;">Distribution des Formats</h4>
                <div class="format-distribution-chart" style="min-height: 250px;">
                    <canvas id="format-distribution-chart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = globalHTML;
    
    // Graphique des couleurs globales
    const globalColorsCtx = document.getElementById('global-colors-chart').getContext('2d');
    if (imageCharts.globalColors) {
        imageCharts.globalColors.destroy();
    }
    
    imageCharts.globalColors = new Chart(globalColorsCtx, {
        type: 'bar',
        data: {
            labels: analysis.global_colors.map((c, i) => `Couleur ${i + 1}`),
            datasets: [{
                label: 'Pourcentage (%)',
                data: analysis.global_colors.map(c => c.percentage),
                backgroundColor: analysis.global_colors.map(c => c.hex),
                borderColor: analysis.global_colors.map(c => c.hex),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Pourcentage (%)',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Couleurs Dominantes Globales',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const color = analysis.global_colors[context.dataIndex];
                            return `${color.hex}: ${color.percentage}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Graphique de distribution des couleurs
    const colorDistCtx = document.getElementById('color-distribution-chart').getContext('2d');
    if (imageCharts.colorDistribution) {
        imageCharts.colorDistribution.destroy();
    }
    
    const colorDistData = analysis.color_distribution;
    const totalColorCount = colorDistData.red_dominant + colorDistData.green_dominant + 
                           colorDistData.blue_dominant + colorDistData.neutral;
    
    imageCharts.colorDistribution = new Chart(colorDistCtx, {
        type: 'doughnut',
        data: {
            labels: ['Rouge Dominant', 'Vert Dominant', 'Bleu Dominant', 'Neutre'],
            datasets: [{
                data: [
                    colorDistData.red_dominant,
                    colorDistData.green_dominant,
                    colorDistData.blue_dominant,
                    colorDistData.neutral
                ],
                backgroundColor: [
                    'rgba(255, 0, 0, 0.8)',
                    'rgba(0, 255, 0, 0.8)',
                    'rgba(0, 0, 255, 0.8)',
                    'rgba(128, 128, 128, 0.8)'
                ],
                borderColor: [
                    'rgb(255, 0, 0)',
                    'rgb(0, 255, 0)',
                    'rgb(0, 0, 255)',
                    'rgb(128, 128, 128)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = totalColorCount > 0 ? ((value / totalColorCount) * 100).toFixed(1) : 0;
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Graphique de distribution des formats
    const formatDistCtx = document.getElementById('format-distribution-chart').getContext('2d');
    if (imageCharts.formatDistribution) {
        imageCharts.formatDistribution.destroy();
    }
    
    const formatData = analysis.format_distribution;
    imageCharts.formatDistribution = new Chart(formatDistCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(formatData),
            datasets: [{
                data: Object.values(formatData),
                backgroundColor: [
                    'rgba(106, 176, 76, 0.8)',
                    'rgba(45, 80, 22, 0.8)',
                    'rgba(61, 139, 61, 0.8)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)'
                ],
                borderColor: [
                    'rgb(106, 176, 76)',
                    'rgb(45, 80, 22)',
                    'rgb(61, 139, 61)',
                    'rgb(102, 126, 234)',
                    'rgb(118, 75, 162)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = Object.values(formatData).reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
