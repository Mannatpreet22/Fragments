# Test that posting an unsupported Content-Type produces a 415 error
POST http://localhost:8080/v1/fragments

# We're sending an unsupported content type (image/png is not in the supported list)
Content-Type: image/png

# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1

# Body of the request (some fake image data)
`fake image data`

# We expect to get back an HTTP 415 Unsupported Media Type
HTTP/1.1 415

# Verify the error response structure
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" matches /^Unsupported content type: .+/
jsonpath "$.error.code" == 415

