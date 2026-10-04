"""Static validator for the BS-CYS notes website.
Checks: tag balance, duplicate ids, data-tab targets, theme menu (8 opts),
internal hrefs, CSS/JS brace balance. Run: python validate_site.py"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

SITE = r"C:\Users\Saad\Desktop\Cys-1\website"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
errors = []


def err(msg):
    errors.append(msg)


def strip_blocks(html):
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S | re.I)
    html = re.sub(r"<style\b[^>]*>.*?</style>", "", html, flags=re.S | re.I)
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    return html


html_files = sorted(f for f in os.listdir(SITE) if f.endswith(".html"))
for fname in html_files:
    with open(os.path.join(SITE, fname), encoding="utf-8", errors="replace") as fh:
        html = fh.read()
    body = strip_blocks(html)

    # tag balance
    stack = []
    for m in re.finditer(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(/?)>", body):
        close, name, selfclose = m.group(1), m.group(2).lower(), m.group(3)
        if name in VOID or selfclose:
            continue
        if not close:
            stack.append(name)
        else:
            if stack and stack[-1] == name:
                stack.pop()
            else:
                err("%s: mismatched </%s> (stack top=%s)" % (fname, name, stack[-1] if stack else "empty"))
    if stack:
        err("%s: unclosed tags %s" % (fname, stack))

    # duplicate ids
    ids = re.findall(r'\bid="([^"]+)"', html)
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        err("%s: duplicate ids %s" % (fname, dupes))

    # data-tab targets
    for target in set(re.findall(r'data-tab="([^"]+)"', html)):
        if 'id="%s"' % target not in html:
            err("%s: data-tab target #%s missing" % (fname, target))

    # exactly 8 theme options
    n_themes = len(re.findall(r'class="theme-opt"', html))
    if n_themes != 8:
        err("%s: %d theme-opts (want 8)" % (fname, n_themes))

    # internal hrefs resolve
    for href in set(re.findall(r'href="([^"#][^"]*)"', html)):
        if href.startswith(("http", "mailto", "data:")):
            continue
        if href.split("#")[0] and not os.path.exists(os.path.join(SITE, href.split("#")[0])):
            err("%s: broken href %s" % (fname, href))

# CSS / JS brace balance
for css in ("styles.css", "themes.css"):
    with open(os.path.join(SITE, css), encoding="utf-8", errors="replace") as fh:
        txt = re.sub(r"/\*.*?\*/", "", fh.read(), flags=re.S)
    if txt.count("{") != txt.count("}"):
        err("%s: brace imbalance %d/%d" % (css, txt.count("{"), txt.count("}")))

with open(os.path.join(SITE, "script.js"), encoding="utf-8", errors="replace") as fh:
    js = re.sub(r"/\*.*?\*/|//[^\n]*", "", fh.read(), flags=re.S)
if js.count("{") != js.count("}"):
    err("script.js: brace imbalance")

if errors:
    print("PROBLEMS FOUND:")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print("ALL CHECKS PASSED")
print("Checked %d HTML files, 2 CSS, 1 JS" % len(html_files))
