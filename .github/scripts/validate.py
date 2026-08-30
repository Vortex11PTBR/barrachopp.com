#!/usr/bin/env python3
"""Validação de CI do site Barra Chopp.

Verifica: estrutura HTML, referências locais, proporção de imagens,
ausência de Google Fonts, handlers inline (bloqueados pela CSP) e
hashes CSP dos scripts inline.
"""
import base64
import hashlib
import os
import re
import sys
from html.parser import HTMLParser

PAGES = ["index.html", "espaco.html", "quiosque.html", "brasaechopp.html", "privacidade.html", "404.html"]
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
errors = []


class Checker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids = {}

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "id" in d:
            self.ids[d["id"]] = self.ids.get(d["id"], 0) + 1
        if tag not in VOID:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            errors.append(f"</{tag}> sem abertura")
            return
        o, _ = self.stack.pop()
        if o != tag:
            errors.append(f"esperava </{o}>, veio </{tag}>")


def run():
    for f in PAGES:
        html = open(f, encoding="utf-8").read()
        c = Checker()
        c.feed(html)
        for t, p in c.stack:
            errors.append(f"{f}: tag <{t}> não fechada ({p})")
        for i, n in c.ids.items():
            if n > 1:
                errors.append(f"{f}: id duplicado #{i}")

        for m in re.findall(r'(?:href|src)="([^"#][^"]*)"', html):
            if m.startswith(("http", "mailto", "tel", "wa.me")) or m.startswith(tuple(PAGES)):
                continue
            if not os.path.exists(m):
                errors.append(f"{f}: referência faltando: {m}")

        if "fonts.googleapis" in html:
            errors.append(f"{f}: ainda usa Google Fonts (deve ser self-hosted)")
        if "onerror=" in html or "onclick=" in html:
            errors.append(f"{f}: handler inline bloqueado pela CSP")

        try:
            from PIL import Image
            for m in re.finditer(r'<img[^>]*src="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"', html):
                src, w, h = m.group(1), int(m.group(2)), int(m.group(3))
                if src.startswith("http") or not os.path.exists(src):
                    continue
                iw, ih = Image.open(src).size
                if abs(iw / ih - w / h) > 0.02:
                    errors.append(f"{f}: proporção errada em {src} ({iw}x{ih} vs atributo {w}x{h})")
        except ImportError:
            pass

    if os.path.exists("_headers"):
        hdr = open("_headers", encoding="utf-8").read()
        html = open("index.html", encoding="utf-8").read()
        for content in re.findall(r"<script(?: type=\"application/ld\+json\")?>(.*?)</script>", html, re.S):
            h = "sha256-" + base64.b64encode(hashlib.sha256(content.encode()).digest()).decode()
            if h not in hdr:
                errors.append(f"script inline sem hash no CSP: {h}")

    if errors:
        print("VALIDAÇÃO FALHOU:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("OK — todas as validações passaram.")


if __name__ == "__main__":
    run()
