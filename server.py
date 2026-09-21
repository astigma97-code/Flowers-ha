#!/usr/bin/env python3
"""Servidor local para «21 de septiembre». Solo usa la biblioteca estándar de Python 3.8+.

Uso:
  python3 server.py                       abre http://127.0.0.1:8000
  python3 server.py --para Valeria        deja listo el enlace con el nombre
  python3 server.py --red                 también accesible desde tu celular (misma Wi-Fi)
  python3 server.py --abrir               abre el navegador solo
  python3 server.py --sync                solo regenera js/respaldo.js y termina

Por qué existe: los navegadores bloquean fetch() en páginas abiertas con doble clic
(file://), así que data/frases.json solo se lee por http. Para que la página funcione
en ambos casos, este script copia el JSON a js/respaldo.js cada vez que cambia.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import socket
import sys
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote

RAIZ = Path(__file__).resolve().parent
FRASES_JSON = RAIZ / "data" / "frases.json"
RESPALDO_JS = RAIZ / "js" / "respaldo.js"
MAX_NOMBRE = 40   # mismo límite que js/main.js

# Windows a veces registra .js como text/plain y el navegador lo rechaza
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("audio/mpeg", ".mp3")


def leer_frases() -> dict:
    datos = json.loads(FRASES_JSON.read_text(encoding="utf-8"))
    frases = datos.get("frases")
    if not isinstance(frases, list) or not frases or not all(isinstance(f, str) and f.strip() for f in frases):
        raise ValueError("data/frases.json: «frases» debe ser una lista de textos no vacíos")
    if not any("{nombre}" not in f for f in frases):
        raise ValueError("data/frases.json: hace falta al menos una frase sin {nombre}")
    for clave in ("fecha", "firma", "firmaConNombre"):
        if not isinstance(datos.get(clave), str) or not datos[clave].strip():
            raise ValueError(f"data/frases.json: falta el texto «{clave}»")
    return datos


def sincronizar(forzar: bool = False) -> bool:
    """Copia data/frases.json a js/respaldo.js. Devuelve True si escribió el archivo."""
    if not forzar and RESPALDO_JS.exists() and RESPALDO_JS.stat().st_mtime >= FRASES_JSON.stat().st_mtime:
        return False
    cuerpo = json.dumps(leer_frases(), ensure_ascii=False, indent=2)
    RESPALDO_JS.write_text(
        "/* ARCHIVO GENERADO por server.py a partir de data/frases.json — no lo edites a mano.\n"
        "   Sirve para que la página funcione al abrirla con doble clic (file://). */\n"
        f"window.CIELO_RESPALDO = {cuerpo};\n",
        encoding="utf-8",
    )
    return True


def ip_local() -> str | None:
    """IP de esta máquina en la red local (no envía ningún paquete)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


class Manejador(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")   # que los cambios se vean al recargar
        super().end_headers()

    def send_head(self):
        if self.path.split("?", 1)[0].endswith(".py"):   # no servir el código del servidor
            self.send_error(404, "No encontrado")
            return None
        return super().send_head()

    def log_request(self, code="-", size="-"):
        if str(code)[0] not in "23":                     # solo se muestran los errores
            super().log_request(code, size)


def main() -> None:
    ap = argparse.ArgumentParser(description="Servidor local de «21 de septiembre».")
    ap.add_argument("--puerto", type=int, default=8000, help="puerto (por defecto 8000)")
    ap.add_argument("--para", default="", help="nombre de la persona; se agrega al enlace como ?para=")
    ap.add_argument("--red", action="store_true", help="permite abrirla desde otros dispositivos de la misma red")
    ap.add_argument("--abrir", action="store_true", help="abre el navegador automáticamente")
    ap.add_argument("--sync", action="store_true", help="solo regenera js/respaldo.js y termina")
    args = ap.parse_args()

    try:
        escrito = sincronizar(forzar=args.sync)
    except (OSError, ValueError, json.JSONDecodeError) as e:
        sys.exit(f"Error: {e}")
    if escrito:
        print("js/respaldo.js actualizado desde data/frases.json")
    if args.sync:
        return

    try:
        servidor = ThreadingHTTPServer(("0.0.0.0" if args.red else "127.0.0.1", args.puerto),
                                       partial(Manejador, directory=str(RAIZ)))
    except OSError as e:
        sys.exit(f"No se pudo usar el puerto {args.puerto}: {e}. Prueba con --puerto 8080")

    nombre = args.para.strip()[:MAX_NOMBRE]
    sufijo = f"?para={quote(nombre)}" if nombre else ""
    url = f"http://127.0.0.1:{args.puerto}/{sufijo}"
    print(f"\n  Abre:  {url}")
    if args.red:
        ip = ip_local()
        if ip:
            print(f"  Celular en la misma Wi-Fi:  http://{ip}:{args.puerto}/{sufijo}")
    print("  Ctrl+C para detener\n")
    if args.abrir:
        threading.Timer(.6, webbrowser.open, [url]).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()
