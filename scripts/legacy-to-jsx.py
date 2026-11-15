#!/usr/bin/env python3
"""Convertit les gabarits HTML statiques de legacy/js/pages.js en JSX (pages de contenu)."""
import re, sys, json
from html.parser import HTMLParser

# Pages déjà portées uniquement ; les autres boutons restent inactifs jusqu'à leur portage.
ROUTES = {'home': '/', 'contact': '/contact', 'faq': '/faq', 'about': '/a-propos', 'shipping': '/livraison',
          'terms': '/conditions', 'payments': '/paiements', 'csr': '/responsabilite-sociale',
          'careers': '/carrieres', 'privacy': '/confidentialite', 'collection': '/collection'}
VOID = {'br', 'hr', 'img', 'input', 'meta', 'link'}
ATTR = {'class': 'className', 'for': 'htmlFor', 'colspan': 'colSpan', 'rowspan': 'rowSpan'}

def style_obj(s):
    items = []
    for part in s.split(';'):
        if ':' not in part: continue
        k, v = part.split(':', 1)
        k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k.strip())
        items.append(f"{k}: {json.dumps(v.strip())}")
    return '{{ ' + ', '.join(items) + ' }}'

class Conv(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.out = []; self.stack = []; self.in_table_rows = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); nav = None
        onclick = a.pop('onclick', None)
        if onclick:
            m = re.match(r"navigateTo\('([a-z-]+)'\)", onclick)
            if m and m.group(1) in ROUTES: nav = ROUTES[m.group(1)]
            elif 'navigateToCollection' in onclick or 'navigateToDepartment' in onclick: nav = '/collection'
        if tag == 'button' and onclick and not nav:
            name_override = 'NavButton'
        if tag == 'tr' and (not self.stack or self.stack[-1] == 'table'):
            self.out.append('<tbody>'); self.stack.append('tbody')
        name = tag
        if tag == 'button' and (nav or onclick):
            name = 'NavButton'
            if nav: a['to'] = nav
        parts = []
        for k, v in a.items():
            if k == 'style': parts.append(f"style={style_obj(v)}")
            elif k == 'to': parts.append(f'to="{v}"')
            elif v is None: parts.append(ATTR.get(k, k))
            elif k in ('rows', 'cols', 'min', 'max', 'value', 'minlength') and v.isdigit(): parts.append(f"{ATTR.get(k, k)}={{{v}}}")
            else: parts.append(f'{ATTR.get(k, k)}="{v}"')
        if name == 'button' and 'type' not in a: parts.insert(0, 'type="button"')
        s = '<' + name + (' ' + ' '.join(parts) if parts else '')
        if tag in VOID:
            self.out.append(s + ' />')
        else:
            self.out.append(s + '>'); self.stack.append(name)
    def handle_endtag(self, tag):
        if tag in VOID: return
        while self.stack and self.stack[-1] == 'tbody' and tag != 'tbody':
            self.out.append('</tbody>'); self.stack.pop()
        if self.stack: self.out.append('</' + self.stack.pop() + '>')
    def handle_data(self, d):
        self.out.append(d.replace('{', '{"{"}').replace('}', '{"}"}'))
    def handle_entityref(self, n): self.out.append('&' + n + ';')
    def handle_charref(self, n): self.out.append('&#' + n + ';')
    def handle_comment(self, d): pass

def extract(src, key):
    m = re.search(r"\n    '?%s'?: `\n\$\{navHeader\('[a-z-]*'\)\}(.*?)\$\{footerBlock\}`" % re.escape(key), src, re.S)
    return m.group(1) if m else None

if __name__ == '__main__':
    src = open('legacy/js/pages.js', encoding='utf8').read()
    html = extract(src, sys.argv[1])
    if html is None: sys.exit('gabarit introuvable')
    html = html.replace("\\'", "'")
    c = Conv(); c.feed(html)
    out = ''.join(c.out)
    out = re.sub(r'\n\s*\n+', '\n', out).strip()
    print(out)
