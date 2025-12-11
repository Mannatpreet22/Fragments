# tests/integration/put-fragments-unauthenticated.hurl
# Test that unauthenticated PUT requests are denied

# First create a fragment
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Test data`

HTTP/1.1 201

[Captures]
fragment_url: header "Location"

# Try to update with invalid credentials
# Note: http-auth library returns plain text "Unauthorized" for 401 responses
# before our middleware can return JSON, so we only verify the status code
PUT {{fragment_url}}

Content-Type: text/plain

[BasicAuth]
invalid@email.com:wrongpassword

`Updated data`

HTTP/1.1 401

[Asserts]
# http-auth returns plain text, so we only verify status code
body contains "Unauthorized"


