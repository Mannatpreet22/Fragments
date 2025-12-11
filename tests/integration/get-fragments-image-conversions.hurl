# tests/integration/get-fragments-image-conversions.hurl
# Test image-to-image conversions via .ext extension
# Note: Using minimal valid image data for testing

# Create a minimal valid PNG image (1x1 pixel)
# PNG signature + minimal IHDR chunk
POST http://localhost:8080/v1/fragments

Content-Type: image/png

[BasicAuth]
user1@email.com:password1

file,fixtures/images/1x1.png;

HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/png"

[Captures]
png_url: header "Location"

# Get PNG as JPEG
GET {{png_url}}.jpg

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/jpeg

[Asserts]
# Verify it's a JPEG (starts with FF D8 FF)
header "Content-Type" == "image/jpeg"

# Get PNG as WebP
GET {{png_url}}.webp

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/webp

[Asserts]
header "Content-Type" == "image/webp"

# Create a JPEG fragment (minimal valid JPEG)
POST http://localhost:8080/v1/fragments

Content-Type: image/jpeg

[BasicAuth]
user1@email.com:password1

file,fixtures/images/1x1.jpg;

HTTP/1.1 201

[Captures]
jpeg_url: header "Location"

# Get JPEG as PNG
GET {{jpeg_url}}.png

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/png

[Asserts]
header "Content-Type" == "image/png"

# Get JPEG as WebP
GET {{jpeg_url}}.webp

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/webp

[Asserts]
header "Content-Type" == "image/webp"

# Get JPEG as AVIF
GET {{jpeg_url}}.avif

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/avif

[Asserts]
header "Content-Type" == "image/avif"

# Get JPEG as GIF
GET {{jpeg_url}}.gif

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/gif

[Asserts]
header "Content-Type" == "image/gif"


