// Función para cargar las métricas del modelo
function loadModelMetrics() {
    fetch('https://script.google.com/macros/s/AKfycbwlxm-mSFqnD2Jkhc9BwOMfrKptfxiDZDtpYlX4Wp5HiKtM3a3CAuyTXsATICoW-wP2/exec')
        .then(response => response.json())
        .then(data => {
            // ...el resto de tu lógica permanece igual...
            // 1) Elegir el modelo (la clave “YYYY_MM_DD_modelo” más reciente)
            const modelKeys = Object.keys(data);
            if (modelKeys.length === 0) {
                console.error('No hay modelos en la respuesta');
                return;
            }
            modelKeys.sort();
            const latestKey = modelKeys[modelKeys.length - 1];
            const metrics   = data[latestKey];

            // 2) Actualizar valores de summary
            const s = metrics.summary;
            document.getElementById('mapValue').textContent =
              (s.map50_95 * 100).toFixed(1) + '%';
            document.getElementById('map50Value').textContent =
              (s.map50 * 100).toFixed(1) + '%';
            document.getElementById('precisionValue').textContent =
              (s.mean_precision * 100).toFixed(1) + '%';
            document.getElementById('recallValue').textContent =
              (s.mean_recall * 100).toFixed(1) + '%';

            const f1El = document.getElementById('f1Value');
            if (f1El) {
              f1El.textContent = (s.mean_f1_score * 100).toFixed(1) + '%';
            }
            const finalMapEl = document.getElementById('finalMapValue');
            if (finalMapEl) {
              finalMapEl.textContent =
                (s.final_map_iou_0_95 * 100).toFixed(1) + '%';
            }

            // 3) Generar gráficos con el objeto `metrics`
            createPrecisionRecallChart(metrics);
            createMapEpochChart(metrics);
            createLearningCurveChart(metrics);

            document.getElementById('performanceSection')
                    .classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error al cargar métricas:', error);
        });
}


// Precisión vs Recall por clase
function createPrecisionRecallChart(metrics) {
    const ctx = document.getElementById('precisionRecallChart')
                         .getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics.class_metrics
                            .map(c => c.class.replace('_NORMAL', '')),
            datasets: [
                {
                    label: 'Precisión',
                    data: metrics.class_metrics
                                 .map(c => c.precision * 100),
                    borderWidth: 1
                },
                {
                    label: 'Recall',
                    data: metrics.class_metrics
                                 .map(c => c.recall * 100),
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Porcentaje (%)' }
                },
                x: { ticks: { maxRotation: 45, minRotation: 45 } }
            },
            plugins: {
                tooltip: {
                  callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${ctx.formattedValue}%`
                  }
                }
            }
        }
    });
}


// Curva de aprendizaje (loss)
function createLearningCurveChart(metrics) {
    const lc = metrics.learning_curve;
    const ctx = document.getElementById('learningCurveChart')
                         .getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: lc.epoch,
            datasets: [
                {
                    label: 'Pérdida Entrenamiento',
                    data: lc.training_loss,
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2
                },
                {
                    label: 'Pérdida Validación',
                    data: lc.validation_loss,
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Épocas' }},
                y: { title: { display: true, text: 'Pérdida' }}
            }
        }
    });
}


// Evolución de mAP por época
function createMapEpochChart(metrics) {
    const lc = metrics.learning_curve;
    const ctx = document.getElementById('mapEpochChart')
                         .getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: lc.epoch,
            datasets: [
                {
                    label: 'mAP@0.5',
                    data: lc.map50.map(v => v * 100),
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2
                },
                {
                    label: 'mAP@0.5:0.95',
                    data: lc['map50-95'].map(v => v * 100),
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Épocas' }},
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'mAP (%)' }
                }
            },
            plugins: {
                tooltip: {
                  callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${ctx.formattedValue}%`
                  }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    

    // Cargar las métricas del modelo
    loadModelMetrics();
});