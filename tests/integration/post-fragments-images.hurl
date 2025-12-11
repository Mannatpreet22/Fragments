# tests/integration/post-fragments-images.hurl
# Test POST with all supported image types

# Create a minimal valid PNG image (1x1 pixel)
POST http://localhost:8080/v1/fragments

Content-Type: image/png

[BasicAuth]
user1@email.com:password1

file,fixtures/images/1x1.png;

HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/png"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

[Captures]
png_url: header "Location"

# Create a minimal valid JPEG image
POST http://localhost:8080/v1/fragments

Content-Type: image/jpeg

[BasicAuth]
user1@email.com:password1

file,fixtures/images/1x1.jpg;

HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/jpeg"

[Captures]
jpeg_url: header "Location"

# Verify we can GET the images
GET {{png_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/png

GET {{jpeg_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

Content-Type: image/jpeg


