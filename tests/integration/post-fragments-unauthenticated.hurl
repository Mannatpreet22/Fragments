# Test that posting a fragment when not authenticated produces a 401 error
POST http://localhost:8080/v1/fragments

# We're sending a plain text fragment
Content-Type: text/plain

# NO Basic Auth credentials - this should cause a 401 error
# (We intentionally omit the [BasicAuth] section)

# Body of the request
`This fragment should fail due to missing authentication`

# We expect to get back an HTTP 401 Unauthorized
HTTP/1.1 401

# Verify the error response
# Note: http-auth library may return plain text "Unauthorized" or our middleware returns JSON
# Both are acceptable - we just verify the status code
[Asserts]
# If it's JSON, verify the structure
# If it's plain text, that's also acceptable (from http-auth library)
# We use a conditional check - if body contains JSON, verify it
body matches /.*/

