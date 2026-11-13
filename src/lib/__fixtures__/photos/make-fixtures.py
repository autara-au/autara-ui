"""Regenerates the preparePhoto fixtures (AUTM-1882). Run from this folder:

    python3 make-fixtures.py . && sips -s format heic heic-source.jpg --out photo.heic && rm heic-source.jpg

Needs Pillow; `sips` is macOS's own. Every image is drawn here, so none of
them carries anyone's photo or real location: the GPS block in
gps-oriented.jpg is a made-up point in Sydney, there to prove it is dropped.
"""
import sys, os
from PIL import Image, ImageDraw
from PIL.ExifTags import Base, GPS, IFD

out = sys.argv[1]
os.makedirs(out, exist_ok=True)

# 1. gps-oriented.jpg: stored 480x320, left half red, right half blue.
#    EXIF Orientation 6 (display rotated 90 CW: 320x480, red on top).
img = Image.new('RGB', (480, 320), (220, 30, 30))
d = ImageDraw.Draw(img)
d.rectangle([240, 0, 479, 319], fill=(30, 60, 220))
exif = Image.Exif()
exif[Base.Make] = 'FixtureCam'
exif[Base.Model] = 'GPS-1'
exif[Base.Orientation] = 6
exif[Base.DateTime] = '2026:11:13 09:00:00'
gps = exif.get_ifd(IFD.GPSInfo)
gps[GPS.GPSLatitudeRef] = 'S'
gps[GPS.GPSLatitude] = (33.0, 52.0, 10.0)
gps[GPS.GPSLongitudeRef] = 'E'
gps[GPS.GPSLongitude] = (151.0, 12.0, 30.0)
img.save(os.path.join(out, 'gps-oriented.jpg'), 'JPEG', quality=80, exif=exif, comment=b'fixture comment')

# 2. transparent.png: 400x300, transparent left half, opaque green right half.
png = Image.new('RGBA', (400, 300), (0, 0, 0, 0))
d = ImageDraw.Draw(png)
d.rectangle([200, 0, 399, 299], fill=(20, 160, 60, 255))
png.save(os.path.join(out, 'transparent.png'), 'PNG', optimize=True)

# 3. photo.webp: 600x400 orange.
webp = Image.new('RGB', (600, 400), (240, 140, 20))
webp.save(os.path.join(out, 'photo.webp'), 'WEBP', quality=70)

# 4. tiny.jpg: 150x150 (under the 200 px floor).
Image.new('RGB', (150, 150), (90, 90, 90)).save(os.path.join(out, 'tiny.jpg'), 'JPEG', quality=70)

# 5. heic source (converted by sips).
Image.new('RGB', (640, 480), (40, 120, 200)).save(os.path.join(out, 'heic-source.jpg'), 'JPEG', quality=80)
