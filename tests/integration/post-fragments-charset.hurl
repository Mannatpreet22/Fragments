# Test that posting a fragment Content-Type with charset works correctly
# and is returned as the fragment's type when doing a GET
POST http://localhost:8080/v1/fragments

# We're sending a plain text fragment with charset specified
Content-Type: text/plain; charset=utf-8

# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1

# Body of the request
`Fragment with charset specification`

# We expect to get back an HTTP 201
HTTP/1.1 201

# Verify the response
[Asserts]
jsonpath "$.status" == "ok"
# The type should be stored as "text/plain" (without charset)
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 35

# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# GET the fragment we just posted to verify the type is returned correctly
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# The Content-Type header should be "text/plain" (charset is stripped when stored)
Content-Type: text/plain

[Asserts]
# Verify the body matches what we sent
body == "Fragment with charset specification"

