const RAIO_TERRA_M = 6371000;

/** Distância em metros entre dois pontos (fórmula de Haversine). */
function distanciaM(lat1, lng1, lat2, lng2) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * A pessoa está no local se a distância até ele cabe no raio. A precisão informada pelo GPS
 * ganha uma folga limitada (toleranciaMaxM), para não punir quem está no ponto com sinal ruim.
 */
function dentroDoRaio({ lat, lng, precisao }, local, toleranciaMaxM = 50) {
  const distancia = distanciaM(lat, lng, local.lat, local.lng);
  const folga = Math.min(Math.max(Number(precisao) || 0, 0), toleranciaMaxM);
  return { ok: distancia <= local.raio_m + folga, distancia };
}

module.exports = { distanciaM, dentroDoRaio };
