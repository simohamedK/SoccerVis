// CSV UI Handler avec toutes les bibliothèques de visualisation

let csvCharts = {};
let currentColumn = null;
let currentChartType = null;
let currentLibrary = 'chartjs';
let randomVisualizations = [];

// Bibliothèques disponibles
const AVAILABLE_LIBRARIES = {
    'chartjs': 'Chart.js',
    'vega': 'Vega.js',
    'd3': 'D3.js',
    'p5': 'p5.js',
    'three': 'Three.js',
    'timeline': 'Timeline.js'
};

function initializeCSV() {
    console.log('Initializing CSV UI');
    loadCSVStats();
    loadCSVColumns();
    // Les visualisations aléatoires seront chargées après l'affichage des contrôles
}

function loadCSVStats() {
    fetch('/api/csv/stats')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayCSVStats(data.stats);
            }
        })
        .catch(error => console.error('Error loading stats:', error));
}

function displayCSVStats(stats) {
    const container = document.getElementById('csv-container');
    if (!container) return;
    
    const statsHTML = `
        <div class="file-stats-section">
            <h3>Statistiques du Fichier</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Fichier</h4>
                    <p>${stats.file_info.filename}</p>
                    <small>${stats.file_info.file_size_mb} MB</small>
                </div>
                <div class="stat-card">
                    <h4>Lignes</h4>
                    <p>${stats.dataset_info.total_rows.toLocaleString()}</p>
                </div>
                <div class="stat-card">
                    <h4>Colonnes</h4>
                    <p>${stats.dataset_info.total_columns}</p>
                    <small>${stats.dataset_info.numeric_columns_count} numériques, ${stats.dataset_info.categorical_columns_count} catégorielles</small>
                </div>
                <div class="stat-card">
                    <h4>Valeurs Manquantes</h4>
                    <p>${stats.dataset_info.missing_values_total.toLocaleString()}</p>
                    <small>${stats.dataset_info.missing_percentage}%</small>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = statsHTML;
}

function loadCSVColumns() {
    fetch('/api/csv/columns')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayVisualizationControls(data.columns);
            }
        })
        .catch(error => console.error('Error loading columns:', error));
}

function displayVisualizationControls(columns) {
    const container = document.getElementById('csv-container');
    if (!container) return;
    
    const numericCols = columns.filter(c => c.is_numeric);
    const categoricalCols = columns.filter(c => !c.is_numeric);
    const allCols = [...numericCols, ...categoricalCols];
    
    const controlsHTML = `
        <div class="visualization-controls">
            <h3>Créer une Visualisation</h3>
            <div class="control-group">
                <label>Type de Graphique:</label>
                <select id="chart-type-selector" onchange="onChartTypeSelected()">
                    <option value="">-- Choisir un type --</option>
                    <option value="bar">Barres</option>
                    <option value="histogram">Histogramme</option>
                    <option value="pie">Camembert (Pie Chart)</option>
                    <option value="scatter">Nuage de points (X/Y)</option>
                    <option value="line">Ligne</option>
                </select>
            </div>
            <div class="control-group" id="single-column-group" style="display:none;">
                <label>Colonne:</label>
                <select id="column-selector" onchange="onColumnSelected()">
                    <option value="">-- Choisir une colonne --</option>
                    <optgroup label="Colonnes Numériques">
                        ${numericCols.map(col => `<option value="${col.name}">${col.name}</option>`).join('')}
                    </optgroup>
                    <optgroup label="Colonnes Catégorielles">
                        ${categoricalCols.map(col => `<option value="${col.name}">${col.name}</option>`).join('')}
                    </optgroup>
                </select>
            </div>
            <div class="control-group" id="multi-column-group" style="display:none;">
                <label>Colonne X (Axe horizontal):</label>
                <select id="column-x-selector">
                    <option value="">-- Choisir colonne X --</option>
                    ${allCols.map(col => `<option value="${col.name}">${col.name}</option>`).join('')}
                </select>
            </div>
            <div class="control-group" id="multi-column-y-group" style="display:none;">
                <label>Colonne Y (Axe vertical):</label>
                <select id="column-y-selector">
                    <option value="">-- Choisir colonne Y --</option>
                    ${numericCols.map(col => `<option value="${col.name}">${col.name}</option>`).join('')}
                </select>
            </div>
            <button onclick="createVisualization()" id="create-viz-btn" class="create-btn" style="display:none;">
                Créer la Visualisation
            </button>
        </div>
        <div id="custom-visualization" class="visualization-container"></div>
        <div class="random-visualizations-section">
            <h3>Visualisations Aléatoires</h3>
            <div id="random-visualizations" class="random-viz-grid"></div>
        </div>
    `;
    
    container.innerHTML += controlsHTML;
    
    // Charger les visualisations aléatoires après l'affichage des contrôles
    setTimeout(() => {
        loadRandomVisualizations(3);
    }, 500);
}

function onChartTypeSelected() {
    const chartType = document.getElementById('chart-type-selector').value;
    currentChartType = chartType;
    
    const singleColGroup = document.getElementById('single-column-group');
    const multiColGroup = document.getElementById('multi-column-group');
    const multiColYGroup = document.getElementById('multi-column-y-group');
    const createBtn = document.getElementById('create-viz-btn');
    
    // Masquer tous les groupes
    singleColGroup.style.display = 'none';
    multiColGroup.style.display = 'none';
    multiColYGroup.style.display = 'none';
    createBtn.style.display = 'none';
    
    if (!chartType) return;
    
    // Afficher les groupes appropriés selon le type de graphique
    if (chartType === 'scatter') {
        multiColGroup.style.display = 'block';
        multiColYGroup.style.display = 'block';
    } else {
        singleColGroup.style.display = 'block';
    }
    
    // Vérifier si on peut afficher le bouton
    checkCanCreate();
}

function onColumnSelected() {
    checkCanCreate();
}

function checkCanCreate() {
    const chartType = document.getElementById('chart-type-selector').value;
    const createBtn = document.getElementById('create-viz-btn');
    
    if (!chartType) {
        createBtn.style.display = 'none';
        return;
    }
    
    if (chartType === 'scatter') {
        const colX = document.getElementById('column-x-selector').value;
        const colY = document.getElementById('column-y-selector').value;
        createBtn.style.display = (colX && colY) ? 'block' : 'none';
    } else {
        const col = document.getElementById('column-selector').value;
        createBtn.style.display = col ? 'block' : 'none';
    }
}

// Ajouter les event listeners pour les sélecteurs X/Y
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const colXSelector = document.getElementById('column-x-selector');
        const colYSelector = document.getElementById('column-y-selector');
        if (colXSelector) {
            colXSelector.addEventListener('change', checkCanCreate);
        }
        if (colYSelector) {
            colYSelector.addEventListener('change', checkCanCreate);
        }
    }, 500);
});

function createVisualization() {
    const chartType = document.getElementById('chart-type-selector').value;
    if (!chartType) {
        alert('Veuillez sélectionner un type de graphique');
        return;
    }
    
    if (chartType === 'scatter') {
        const colX = document.getElementById('column-x-selector').value;
        const colY = document.getElementById('column-y-selector').value;
        
        if (!colX || !colY) {
            alert('Veuillez sélectionner les colonnes X et Y');
            return;
        }
        
        // Récupérer les données pour les deux colonnes
        fetch('/api/csv/multiple-columns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ columns: [colX, colY], limit: 100 })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                renderScatterChart(data.data, colX, colY);
            }
        })
        .catch(error => console.error('Error loading columns data:', error));
    } else {
        const column = document.getElementById('column-selector').value;
        if (!column) {
            alert('Veuillez sélectionner une colonne');
            return;
        }
        
        fetch(`/api/csv/column/${encodeURIComponent(column)}/data?limit=100`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    renderVisualization(data.data, chartType, column, 'chartjs');
                }
            })
            .catch(error => console.error('Error loading column data:', error));
    }
}

function renderVisualization(data, chartType, columnName, library) {
    const container = document.getElementById('custom-visualization');
    container.innerHTML = `
        <h4>${columnName} - ${getChartTypeName(chartType)}</h4>
        <div id="viz-canvas-container"></div>
    `;
    
    const canvasContainer = document.getElementById('viz-canvas-container');
    
    // Toujours utiliser Chart.js pour la cohérence
    renderChartJS(data, chartType, columnName, canvasContainer);
}

function getChartTypeName(chartType) {
    const names = {
        'bar': 'Graphique en Barres',
        'histogram': 'Histogramme',
        'pie': 'Camembert',
        'scatter': 'Nuage de Points',
        'line': 'Graphique en Ligne'
    };
    return names[chartType] || chartType;
}

function renderScatterChart(columnsData, colX, colY) {
    const container = document.getElementById('custom-visualization');
    container.innerHTML = `
        <h4>${colX} vs ${colY} - Nuage de Points</h4>
        <div id="viz-canvas-container"></div>
    `;
    
    const canvasContainer = document.getElementById('viz-canvas-container');
    const canvas = document.createElement('canvas');
    canvas.id = 'scatter-chart';
    canvasContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Préparer les données pour le scatter
    const xData = columnsData[colX].data;
    const yData = columnsData[colY].data;
    const minLength = Math.min(xData.length, yData.length);
    
    const scatterData = [];
    for (let i = 0; i < minLength; i++) {
        scatterData.push({
            x: xData[i],
            y: yData[i]
        });
    }
    
    if (csvCharts['custom']) {
        csvCharts['custom'].destroy();
    }
    
    csvCharts['custom'] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `${colX} vs ${colY}`,
                data: scatterData,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: `X: ${colX}`,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `Y: ${colY}`,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Nuage de Points: ${colX} (X) vs ${colY} (Y)`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `X (${colX}): ${context.parsed.x.toFixed(2)}, Y (${colY}): ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function renderChartJS(data, chartType, columnName, container) {
    const canvas = document.createElement('canvas');
    canvas.id = 'chartjs-canvas';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    let chartConfig = {};
    
    if (data.type === 'numeric') {
        if (chartType === 'bar' || chartType === 'line') {
            chartConfig = {
                type: chartType,
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: columnName,
                        data: data.data,
                        backgroundColor: chartType === 'bar' ? 'rgba(102, 126, 234, 0.6)' : 'rgba(102, 126, 234, 0.2)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: columnName,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Index',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${columnName} - ${getChartTypeName(chartType)}`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: 20
                        }
                    }
                }
            };
        } else if (chartType === 'histogram') {
            const bins = createHistogramBins(data.data, 20);
            chartConfig = {
                type: 'bar',
                data: {
                    labels: bins.labels,
                    datasets: [{
                        label: 'Fréquence',
                        data: bins.frequencies,
                        backgroundColor: 'rgba(102, 126, 234, 0.6)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Fréquence',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: columnName,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${columnName} - Histogramme`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: 20
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            };
        } else if (chartType === 'line') {
            chartConfig = {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: columnName,
                        data: data.data,
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: columnName,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Index',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${columnName} - Graphique en Ligne`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: 20
                        }
                    }
                }
            };
        }
    } else {
        if (chartType === 'bar') {
            chartConfig = {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: columnName,
                        data: data.data,
                        backgroundColor: 'rgba(102, 126, 234, 0.6)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Nombre d\'occurrences',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: columnName,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${columnName} - Graphique en Barres`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: 20
                        }
                    }
                }
            };
        } else if (chartType === 'pie' || chartType === 'donut') {
            chartConfig = {
                type: chartType === 'pie' ? 'pie' : 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: columnName,
                        data: data.data,
                        backgroundColor: generateColors(data.labels.length)
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `${columnName} - Camembert`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: 20
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
        }
    }
    
    if (csvCharts['custom']) {
        csvCharts['custom'].destroy();
    }
    csvCharts['custom'] = new Chart(ctx, chartConfig);
}

function renderVega(data, chartType, columnName, container) {
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": `${columnName} - ${chartType}`,
        "data": {
            "values": data.type === 'numeric' 
                ? data.data.map((d, i) => ({index: i, value: d}))
                : data.labels.map((label, i) => ({category: label, value: data.data[i]}))
        },
        "mark": chartType === 'bar' ? "bar" : chartType === 'line' ? "line" : "bar",
        "encoding": {
            "x": {
                "field": data.type === 'numeric' ? "index" : "category",
                "type": data.type === 'numeric' ? "quantitative" : "nominal"
            },
            "y": {
                "field": "value",
                "type": "quantitative"
            }
        }
    };
    
    vegaEmbed(container, spec, {actions: false});
}

function renderD3(data, chartType, columnName, container) {
    const width = 800;
    const height = 400;
    const margin = {top: 20, right: 20, bottom: 40, left: 40};
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleBand()
        .domain(data.type === 'numeric' ? data.labels.map(String) : data.labels)
        .range([0, width - margin.left - margin.right])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data.data)])
        .range([height - margin.top - margin.bottom, 0]);
    
    g.selectAll('.bar')
        .data(data.data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => xScale(data.type === 'numeric' ? String(i) : data.labels[i]))
        .attr('y', d => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - margin.top - margin.bottom - yScale(d))
        .attr('fill', '#667eea');
    
    g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    g.append('g')
        .call(d3.axisLeft(yScale));
}

function renderP5(data, chartType, columnName, container) {
    // Vérifier que p5.js est chargé
    if (typeof p5 === 'undefined') {
        container.innerHTML = '<p>p5.js n\'est pas chargé. Veuillez recharger la page.</p>';
        return;
    }
    
    // Nettoyer le conteneur
    container.innerHTML = '';
    
    const sketch = function(p) {
        p.setup = function() {
            const canvas = p.createCanvas(800, 400);
            canvas.parent(container);
            p.background(255);
            
            const maxVal = Math.max(...data.data);
            const dataLength = Math.min(data.data.length, 100); // Limiter pour les performances
            const barWidth = 800 / dataLength;
            
            for (let i = 0; i < dataLength; i++) {
                const barHeight = (data.data[i] / maxVal) * 350;
                p.fill(102, 126, 234);
                p.rect(i * barWidth, 400 - barHeight, barWidth - 2, barHeight);
            }
        };
    };
    
    new p5(sketch, container);
}

function renderThree(data, chartType, columnName, container) {
    // Vérifier que Three.js est chargé
    if (typeof THREE === 'undefined') {
        container.innerHTML = '<p>Three.js n\'est pas chargé. Veuillez recharger la page.</p>';
        return;
    }
    
    // Nettoyer le conteneur
    container.innerHTML = '';
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 800/400, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(800, 400);
    container.appendChild(renderer.domElement);
    
    const maxVal = Math.max(...data.data);
    const barWidth = 0.5;
    const spacing = 1;
    
    // Limiter à 50 barres pour les performances
    const dataLength = Math.min(data.data.length, 50);
    
    for (let i = 0; i < dataLength; i++) {
        const height = (data.data[i] / maxVal) * 5;
        const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
        const material = new THREE.MeshBasicMaterial({color: 0x667eea});
        const bar = new THREE.Mesh(geometry, material);
        bar.position.set((i - dataLength/2) * spacing, height/2, 0);
        scene.add(bar);
    }
    
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    
    function animate() {
        requestAnimationFrame(animate);
        scene.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

function loadRandomVisualizations(count) {
    // S'assurer d'avoir 3 types différents : bar, histogram, pie
    const chartTypes = ['bar', 'histogram', 'pie'];
    const promises = [];
    
    for (let i = 0; i < count; i++) {
        const chartType = chartTypes[i] || 'bar'; // Utiliser le type correspondant ou bar par défaut
        promises.push(
            fetch(`/api/csv/random-visualization?chart_type=${chartType}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        return data.visualization;
                    }
                })
                .catch(error => {
                    console.error(`Error loading ${chartType} visualization:`, error);
                    // En cas d'erreur, essayer sans spécifier le type
                    return fetch('/api/csv/random-visualization')
                        .then(response => response.json())
                        .then(data => {
                            if (data.status === 'success') {
                                return data.visualization;
                            }
                        });
                })
        );
    }
    
    Promise.all(promises).then(visualizations => {
        const validViz = visualizations.filter(v => v !== undefined && v !== null);
        if (validViz.length > 0) {
            displayRandomVisualizations(validViz);
        }
    });
}

function displayRandomVisualizations(visualizations) {
    const container = document.getElementById('random-visualizations');
    if (!container) return;
    
    // Ne pas vider le conteneur si des visualisations existent déjà
    if (container.children.length > 0) {
        return;
    }
    
    visualizations.forEach((viz, index) => {
        const vizCard = document.createElement('div');
        vizCard.className = 'random-viz-card';
        vizCard.innerHTML = `
            <h4>${viz.column} - ${getChartTypeName(viz.chart_type)}</h4>
            <div id="random-viz-${index}" class="random-viz-container"></div>
        `;
        container.appendChild(vizCard);
        
        setTimeout(() => {
            renderRandomVisualization(viz.data, viz.chart_type, viz.column, 'chartjs', `random-viz-${index}`);
        }, 100 * (index + 1)); // Délai progressif pour éviter les conflits
    });
}

function renderRandomVisualization(data, chartType, columnName, library, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Vérifier si un graphique existe déjà pour éviter les doublons
    const existingChart = csvCharts[containerId];
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Toujours utiliser Chart.js pour la cohérence
    renderChartJSForRandom(data, chartType, columnName, container, containerId);
}

function renderChartJSForRandom(data, chartType, columnName, container, chartId) {
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${chartId}`;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    let chartConfig = {};
    
    if (data.type === 'numeric') {
        if (chartType === 'bar') {
            chartConfig = {
                type: 'bar',
                data: {
                    labels: data.labels.slice(0, 30), // Limiter à 30 pour la lisibilité
                    datasets: [{
                        label: columnName,
                        data: data.data.slice(0, 30),
                        backgroundColor: 'rgba(102, 126, 234, 0.6)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: { y: { beginAtZero: true } },
                    plugins: {
                        legend: { display: false }
                    }
                }
            };
        } else if (chartType === 'histogram') {
            const bins = createHistogramBins(data.data, 15);
            chartConfig = {
                type: 'bar',
                data: {
                    labels: bins.labels,
                    datasets: [{
                        label: 'Fréquence',
                        data: bins.frequencies,
                        backgroundColor: 'rgba(102, 126, 234, 0.6)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: { beginAtZero: true },
                        x: {
                            title: {
                                display: true,
                                text: columnName
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            };
        }
    } else {
        if (chartType === 'bar') {
            chartConfig = {
                type: 'bar',
                data: {
                    labels: data.labels.slice(0, 20),
                    datasets: [{
                        label: columnName,
                        data: data.data.slice(0, 20),
                        backgroundColor: 'rgba(102, 126, 234, 0.6)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: { y: { beginAtZero: true } },
                    plugins: {
                        legend: { display: false }
                    }
                }
            };
        } else if (chartType === 'pie') {
            chartConfig = {
                type: 'pie',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: generateColors(data.labels.length)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `${columnName} - Camembert`,
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            padding: 15
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 10,
                                usePointStyle: true,
                                font: { size: 11 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
        }
    }
    
    csvCharts[chartId] = new Chart(ctx, chartConfig);
}

function createHistogramBins(data, numBins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / numBins;
    const bins = new Array(numBins).fill(0);
    const labels = [];
    
    for (let i = 0; i < numBins; i++) {
        labels.push((min + i * binWidth).toFixed(2));
    }
    
    data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
        bins[binIndex]++;
    });
    
    return { labels, frequencies: bins };
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}
