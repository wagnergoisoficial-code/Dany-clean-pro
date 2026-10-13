# Brand mark

`logo-source.jpeg` is the logo as it was supplied: a circular badge on a flat
near-white background, 1254×1254.

The files in `public/` are generated from it — the background is replaced with
transparency so the mark sits on the white header and the dark footer without
a panel behind it.

How the transparency is made, in case it needs redoing: inside a radius of 595
the image is kept opaque no matter what it looks like, because the wordmark is
white and judging it by its distance from a white background would eat the
letters. Between 595 and 629 the alpha follows how far each pixel is from the
background colour, which keeps the rim's own anti-aliasing instead of stamping
a hard circle over it. Beyond 629 it is clear. The result is padded to a square
rather than resized to one, so the circle is not leant over by a percent.

Generated: public/logo.png (512), logo-192.png, apple-touch-icon.png (180),
favicon-32.png.
