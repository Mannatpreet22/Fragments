# tests/integration/put-fragments-unsupported-type.hurl
# Test that PUT with unsupported content type returns 415

# First create a fragment
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Test data`

HTTP/1.1 201

[Captures]
fragment_url: header "Location"

# Try to update with unsupported type
PUT {{fragment_url}}

Content-Type: video/mp4

[BasicAuth]
user1@email.com:password1

`Video data`

HTTP/1.1 415

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" matches /^Unsupported content type: .+/


