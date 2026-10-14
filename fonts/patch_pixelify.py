"""Pixelify Sans has no Cyrillic capitals О, П and І, so they fell back to another font.
This builds pixelify-sans-cyrfix-<weight>.woff2 from the Latin file: О and І reuse the Latin O and I,
П is drawn from the same stems as H with the top bar of O. css/fonts.css loads it for just those letters.
Run from the repo root: python3 fonts/patch_pixelify.py (needs: pip install fonttools brotli)."""
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools import subset

for w in ('400', '600'):
    f = TTFont(f'fonts/pixelify-sans-latin-{w}-normal.woff2')
    gs, cm = f.getGlyphSet(), f.getBestCmap()

    def pts(ch):
        p = RecordingPen()
        gs[cm[ord(ch)]].draw(p)
        return [a[0] for op, a in p.value if op in ('moveTo', 'lineTo')]

    h = pts('H')
    xs, ys = sorted({x for x, _ in h}), sorted({y for _, y in h})
    left, stem_l, stem_r, right = xs[0], xs[1], xs[-2], xs[-1]
    bottom, top = ys[0], ys[-1]
    o = pts('O')
    bar = top - max(y for x, y in o[12:])  # thickness of O's top edge (its inner contour starts at point 12)
    pen = TTGlyphPen(None)
    pen.moveTo((left, bottom))
    for p in [(left, top), (right, top), (right, bottom), (stem_r, bottom), (stem_r, top - bar), (stem_l, top - bar), (stem_l, bottom)]:
        pen.lineTo(p)
    pen.closePath()
    f['glyf'].glyphs['uni041F'] = pen.glyph()
    f.setGlyphOrder(f.getGlyphOrder() + ['uni041F'])
    f['hmtx'].metrics['uni041F'] = f['hmtx'].metrics[cm[ord('H')]]
    for t in f['cmap'].tables:
        if t.isUnicode():
            t.cmap[0x41E] = cm[ord('O')]
            t.cmap[0x406] = cm[ord('I')]
            t.cmap[0x41F] = 'uni041F'
    opt = subset.Options()
    opt.flavor = 'woff2'
    opt.layout_features = []
    s = subset.Subsetter(opt)
    s.populate(unicodes=[0x41E, 0x41F, 0x406])
    s.subset(f)
    f.flavor = 'woff2'
    f.save(f'fonts/pixelify-sans-cyrfix-{w}-normal.woff2')
    print(w, 'ok', (left, stem_l, stem_r, right, bottom, top, bar))
