// IS 6403:1981 typical values for preset soils
const soilPresets = {
  clay: { cohesion: 25, unitWeight: 18, phi: 0 },
  sand: { cohesion: 0, unitWeight: 18, phi: 30 },
  gravel: { cohesion: 0, unitWeight: 20, phi: 35 },
  blackcotton: { cohesion: 15, unitWeight: 17, phi: 10 },
  alluvial: { cohesion: 10, unitWeight: 17, phi: 25 },
  red: { cohesion: 10, unitWeight: 18, phi: 20 }
};

// IS 6403:1981 Bearing Capacity Factors (from Figure 1, interpolated for common φ)
function getISFactors(phi) {
  // Table for φ = 0, 10, 20, 25, 30, 35, 40, 45 (from IS 6403:1981)
  const table = [
    { phi: 0, Nc: 5.7, Nq: 1.0, Ngamma: 0.0 },
    { phi: 10, Nc: 7.5, Nq: 1.6, Ngamma: 0.8 },
    { phi: 20, Nc: 12.3, Nq: 4.5, Ngamma: 5.0 },
    { phi: 25, Nc: 16.7, Nq: 7.4, Ngamma: 9.7 },
    { phi: 30, Nc: 30.14, Nq: 18.40, Ngamma: 22.40 },
    { phi: 35, Nc: 41.4, Nq: 41.4, Ngamma: 41.4 },
    { phi: 40, Nc: 55.0, Nq: 81.3, Ngamma: 81.3 },
    { phi: 45, Nc: 133.9, Nq: 254.5, Ngamma: 254.5 }
  ];
  // Find closest lower and upper
  let lower = table[0], upper = table[table.length-1];
  for (let i = 0; i < table.length-1; i++) {
    if (phi >= table[i].phi && phi <= table[i+1].phi) {
      lower = table[i];
      upper = table[i+1];
      break;
    }
  }
  // Linear interpolation
  const range = upper.phi - lower.phi;
  if (range === 0) return lower;
  const ratio = (phi - lower.phi) / range;
  return {
    Nc: lower.Nc + (upper.Nc - lower.Nc) * ratio,
    Nq: lower.Nq + (upper.Nq - lower.Nq) * ratio,
    Ngamma: lower.Ngamma + (upper.Ngamma - lower.Ngamma) * ratio
  };
}

// Auto-fill values for preset soils
document.getElementById('soilType').addEventListener('change', function() {
  const val = this.value;
  if (soilPresets[val]) {
    document.getElementById('cohesion').value = soilPresets[val].cohesion;
    document.getElementById('unitWeight').value = soilPresets[val].unitWeight;
    document.getElementById('phi').value = soilPresets[val].phi;
  } else {
    document.getElementById('cohesion').value = '';
    document.getElementById('unitWeight').value = '';
    document.getElementById('phi').value = '';
  }
});

function showError(msg) {
  const errorDiv = document.getElementById('error');
  errorDiv.style.display = 'block';
  errorDiv.textContent = msg;
  document.getElementById('result').style.display = 'none';
}

function clearError() {
  const errorDiv = document.getElementById('error');
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';
}

function calculateBearing() {
  clearError();

  // Get input values
  const soilType = document.getElementById('soilType').value;
  const cohesion = parseFloat(document.getElementById('cohesion').value);
  const unitWeight = parseFloat(document.getElementById('unitWeight').value);
  const depth = parseFloat(document.getElementById('depth').value);
  const width = parseFloat(document.getElementById('width').value);
  const phi = parseFloat(document.getElementById('phi').value);
  const fos = parseFloat(document.getElementById('fos').value);

  // Validate inputs
  if (!soilType || isNaN(cohesion) || isNaN(unitWeight) || isNaN(depth) ||
      isNaN(width) || isNaN(phi) || isNaN(fos)) {
    showError('Please fill in all fields with valid values.');
    return;
  }
  if (cohesion < 0 || unitWeight <= 0 || depth <= 0 || width <= 0 || phi < 0 || phi > 45 || fos < 1) {
    showError('Please enter sensible, positive values for all inputs. φ should be between 0° and 45°.');
    return;
  }

  // IS 6403:1981 - Overburden pressure q = γ × Df
  const q = unitWeight * depth;

  // IS 6403:1981 - Get factors from code
  const { Nc, Nq, Ngamma } = getISFactors(phi);

  // IS 6403:1981 - Bearing capacity formula
  const qu = (cohesion * Nc) + (q * Nq) + (0.5 * unitWeight * width * Ngamma);
  const qall = qu / fos;

  // Display results
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <h2>Results (IS 6403:1981)</h2>
    <ul>
      <li><strong>Ultimate Bearing Capacity (q<sub>u</sub>):</strong> ${qu.toFixed(2)} kPa</li>
      <li><strong>Safe Bearing Capacity (q<sub>allowable</sub>):</strong> ${qall.toFixed(2)} kPa</li>
      <li><strong>Bearing Capacity Factors (from IS 6403:1981):</strong>
        <ul>
          <li>N<sub>c</sub>: ${Nc.toFixed(2)}</li>
          <li>N<sub>q</sub>: ${Nq.toFixed(2)}</li>
          <li>N<sub>&gamma;</sub>: ${Ngamma.toFixed(2)}</li>
        </ul>
      </li>
      <li><strong>Overburden Pressure (q):</strong> ${q.toFixed(2)} kPa</li>
    </ul>
    <p style="font-size:0.96em; color:#2a5298; margin-top: 10px;">
      <em>Note:</em> Calculations as per IS 6403:1981 for strip footings. Apply water table correction if required (Clause 5.3.3).
    </p>
  `;
  resultDiv.style.display = 'block';
}
