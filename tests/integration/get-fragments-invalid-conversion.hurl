# tests/integration/get-fragments-invalid-conversion.hurl
# Test that unsupported conversions return 415

# Create a text fragment
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Test data`

HTTP/1.1 201

[Captures]
text_url: header "Location"

# Try to convert text to image (unsupported)
GET {{text_url}}.png

[BasicAuth]
user1@email.com:password1

HTTP/1.1 415

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" matches /^Conversion from .+ to .+ is not supported/

# Create an image fragment
POST http://localhost:8080/v1/fragments

Content-Type: image/png

[BasicAuth]
user1@email.com:password1

file,fixtures/images/1x1.png;

HTTP/1.1 201

[Captures]
image_url: header "Location"

# Try to convert image to text (unsupported)
GET {{image_url}}.txt

[BasicAuth]
user1@email.com:password1

HTTP/1.1 415

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" matches /^Conversion from .+ to .+ is not supported/


