/* ════════════════════════════════════════════════════════════
   config.js — lo único que necesitas tocar en el código
   · nombre: aparece en la firma ("Para Valeria") y activa las frases
     personalizadas. También funciona por enlace, sin editar nada:
       index.html?para=Valeria
   · volumen / fundidoMs: la música de assets/musica.mp3
   · Las frases viven en data/frases.json
   ════════════════════════════════════════════════════════════ */
window.CIELO_CONFIG = {
  nombre: '',
  primeraFraseMs: 6200,   // cuándo aparece la primera frase (después de la apertura)
  pausaMin: 6400,         // tiempo mínimo que se queda cada frase
  pausaMax: 11800,        // tiempo máximo
  volumen: 0.65,          // volumen de assets/musica.mp3 (0 a 1)
  fundidoMs: 2600         // cuánto tarda la música en subir al entrar
};
